import { Header } from "@/app/components/header";
import { FocusPointSubmitForm } from "@/app/components/focuspoint-submit-form";

export const metadata = {
  title: "Submit FocusPoint — CERBERUS 2026",
  description: "Submit a corruption investigation lead for CERBERUS search bots to investigate.",
};

export default function SubmitPage() {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">
            Submit a FocusPoint
          </h2>
          <p className="mt-2 text-sm text-zinc-400">
            Submit corruption leads, documents, and links for CERBERUS bots to investigate.
            All submissions are public and anonymous.
          </p>
        </div>

        <FocusPointSubmitForm />
      </main>
    </div>
  );
}
