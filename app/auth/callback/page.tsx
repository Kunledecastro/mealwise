import { Suspense } from "react";
import { CallbackView } from "./callback-view";

export const metadata = { title: "Signing you in" };

export default function Page() {
  return (
    <Suspense>
      <CallbackView />
    </Suspense>
  );
}
