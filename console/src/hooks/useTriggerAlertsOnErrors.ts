import { useEffect } from "react";
import { useFusionAccessTranslations } from "@/hooks/useFusionAccessTranslations";
import { useStoreContext } from "./useStoreContext";
import { getDigest } from "@/utils/crypto/hash";
import type { AlertsSlice } from "@/contexts/store/types";

const processErrors = async (
  errors: (Error | string)[],
  alerts: AlertsSlice,
  t: (msg: string) => string
): Promise<AlertsSlice> => {
  const alertsToAdd: AlertsSlice = [];
  const sanitizedErrors = errors.filter(Boolean);
  for (const e of sanitizedErrors) {
    const description = e instanceof Error ? e.message : e;
    const descriptionDigest = await getDigest(description);
    alertsToAdd.push({
      key: descriptionDigest,
      variant: "danger",
      title: t("An error occurred while watching resources"),
      description,
      isDismissable: true,
    });
  }

  return alertsToAdd.filter(
    (alert) => !alerts.find((a) => a.key === alert.key)
  );
};

export const useTriggerAlertsOnErrors = (...errors: (Error | string)[]) => {
  const [state, dispatch] = useStoreContext();
  const { t } = useFusionAccessTranslations();

  useEffect(() => {
    (async () => {
      const newAlerts = await processErrors(errors, state.alerts, t);
      newAlerts.forEach((alert) => {
        dispatch({ type: "addAlert", payload: alert });
      });
    })();

    // TODO(jkilzi): rethink the alerts cleanup
  }, [dispatch, errors, state.alerts, t]);
};
