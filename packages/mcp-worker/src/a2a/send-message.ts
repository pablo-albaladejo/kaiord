import type { HandlerDeps } from "../deps";
import { callTool } from "./call-tool";
import type { RpcId } from "./json-rpc";
import {
  A2A_ERRORS,
  a2aError,
  INTERNAL_ERROR,
  INVALID_PARAMS,
  rpcError,
  rpcResult,
} from "./json-rpc";
import type { SkillCall } from "./read-message";
import { readMessage, readSkillCall } from "./read-message";
import { SKILL_IDS } from "./skills";
import type { TaskInput, UserMessage } from "./task";
import { buildTask, randomId } from "./task";

const CONTEXT_ID = /^[A-Za-z0-9_-]{1,64}$/;

const GUIDANCE = `Name a skill in the first data part: {"skill": "<id>", ...arguments}. Skills: ${SKILL_IDS.join(", ")}.`;

type Params = {
  readonly message?: unknown;
  readonly configuration?: {
    readonly returnImmediately?: unknown;
    readonly historyLength?: unknown;
  };
};

/** ProtoJSON writes an unset string as "", so "" and null mean absent. */
const isAbsent = (value: unknown): boolean =>
  value === undefined || value === null || value === "";

type TaskBase = {
  readonly contextId: string;
  readonly message: UserMessage;
  readonly omitHistory: boolean;
};

const taskReply = (id: RpcId, input: TaskInput): Response =>
  rpcResult(id, { task: buildTask(input) });

const runSkill = async (
  id: RpcId,
  call: SkillCall,
  base: TaskBase,
  deps: HandlerDeps
): Promise<Response> => {
  const outcome = await callTool(call.skill, call.args, deps);
  if (!outcome.ok) {
    const internal = outcome.code === INTERNAL_ERROR;
    const text = internal ? "Internal error" : "Invalid parameters";
    return rpcError(id, outcome.code, text);
  }
  if (outcome.failed) {
    const statusText = outcome.parts.map((part) => part.text).join("\n");
    return taskReply(id, { ...base, state: "TASK_STATE_FAILED", statusText });
  }
  return taskReply(id, {
    ...base,
    state: "TASK_STATE_COMPLETED",
    statusText: `${call.skill} completed`,
    artifact: { name: call.skill, parts: outcome.parts },
  });
};

export const sendMessage = async (
  id: RpcId,
  params: Params,
  deps: HandlerDeps
): Promise<Response> => {
  const message = readMessage(params.message);
  if (message === null) return rpcError(id, INVALID_PARAMS, "Invalid message");
  if (!isAbsent(message.taskId)) {
    const text = "Task not found: tasks are not retained";
    return a2aError(id, A2A_ERRORS.taskNotFound, text);
  }
  if (params.configuration?.returnImmediately === true) {
    const text = "Non-blocking send is not supported: tasks are not retained";
    return a2aError(id, A2A_ERRORS.unsupported, text);
  }
  const given = isAbsent(message.contextId) ? randomId() : message.contextId;
  if (typeof given !== "string" || !CONTEXT_ID.test(given)) {
    return rpcError(id, INVALID_PARAMS, "Invalid contextId");
  }
  const omitHistory = params.configuration?.historyLength === 0;
  const base = { contextId: given, message, omitHistory };
  const call = readSkillCall(message.parts, SKILL_IDS);
  if (call === null) {
    return taskReply(id, {
      ...base,
      state: "TASK_STATE_REJECTED",
      statusText: GUIDANCE,
    });
  }
  return runSkill(id, call, base, deps);
};
