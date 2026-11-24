import { useEffect, useRef, useState } from "react";

import { useActiveLocale } from "../../../i18n/LocaleProvider";
import { useTranslate } from "../../../i18n/use-translate";
import {
  type HealthQuestion,
  type HealthShareAnswer,
  healthSharingGate,
} from "../../../lib/health-sharing-gate";
import { healthNoticeCopy } from "./health-notice-copy";
import { HealthNoticeDialog } from "./HealthNoticeDialog";

type Waiting = {
  question: HealthQuestion;
  answer: (value: HealthShareAnswer) => void;
  drop: () => void;
};

const aborted = () => new DOMException("Aborted", "AbortError");

/**
 * Asks the athlete, the first time, whether a request may carry their health
 * data to a Provider: it answers the gate's questions one at a time. A
 * question the gate cancels (every run that asked it stopped) leaves the
 * screen unanswered, and so does every question when the notice unmounts.
 */
export const HealthSharingNotice = () => {
  const t = useTranslate("dataFlows");
  const locale = useActiveLocale();
  const [queue, setQueue] = useState<Waiting[]>([]);
  const queueRef = useRef<Waiting[]>([]);
  queueRef.current = queue;

  useEffect(() => {
    const unmount = healthSharingGate.setAsker(
      (question, cancelled) =>
        new Promise((answer, reject) => {
          const entry: Waiting = { question, answer, drop: () => undefined };
          entry.drop = () => {
            setQueue((all) => all.filter((w) => w !== entry));
            reject(aborted());
          };
          cancelled.addEventListener("abort", entry.drop, { once: true });
          setQueue((all) => [...all, entry]);
        })
    );
    return () => {
      unmount();
      queueRef.current.forEach((waiting) => waiting.drop());
    };
  }, []);

  const current = queue[0];
  if (!current) return null;
  const choose = (value: HealthShareAnswer) => {
    current.answer(value);
    setQueue((all) => all.slice(1));
  };
  return (
    <HealthNoticeDialog
      copy={healthNoticeCopy(current.question, t, locale)}
      onChoose={choose}
    />
  );
};
