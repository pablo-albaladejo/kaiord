import { useEffect, useState } from "react";

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
};

/**
 * Asks the athlete, the first time, whether a request may carry their health
 * data to a Provider: it answers the gate's questions one at a time.
 */
export const HealthSharingNotice = () => {
  const t = useTranslate("dataFlows");
  const locale = useActiveLocale();
  const [queue, setQueue] = useState<Waiting[]>([]);

  useEffect(
    () =>
      healthSharingGate.setAsker(
        (question) =>
          new Promise((answer) =>
            setQueue((all) => [...all, { question, answer }])
          )
      ),
    []
  );

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
