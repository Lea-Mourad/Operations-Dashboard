"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import StatusBadge from "@/components/StatusBadge";
import {
  createAdvancedJsonDefault,
  createCampaignDefaults,
  createFinanceDefaults,
  createGuestDefaults,
} from "@/lib/dashboard/defaults";
import { emitOperationsRefresh, submitEvent } from "@/lib/dashboard/client";
import {
  getActionDisplay,
  getWorkflowLabel,
} from "@/lib/dashboard/presenters";
import type { SubmitEventResponse } from "@/lib/dashboard/types";

type TabKey = "finance" | "campaign" | "guest" | "advanced";

type SubmitState = {
  loading: boolean;
  error: string | null;
  result: SubmitEventResponse | null;
};

export default function SubmitEventPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("finance");
  const [finance, setFinance] = useState(createFinanceDefaults);
  const [campaign, setCampaign] = useState(createCampaignDefaults);
  const [guest, setGuest] = useState(createGuestDefaults);
  const [advancedJson, setAdvancedJson] = useState(createAdvancedJsonDefault);
  const [submitState, setSubmitState] = useState<SubmitState>({
    loading: false,
    error: null,
    result: null,
  });

  const tabs = useMemo(
    () => [
      { key: "finance" as const, title: "FinanceOps", subtitle: "Overdue Invoice" },
      { key: "campaign" as const, title: "CampaignOps", subtitle: "Client Brief" },
      { key: "guest" as const, title: "GuestOps", subtitle: "Reservation Change" },
      { key: "advanced" as const, title: "Advanced JSON", subtitle: "Raw editor" },
    ],
    [],
  );

  async function handleSubmission(payload: unknown) {
    setSubmitState({
      loading: true,
      error: null,
      result: null,
    });

    try {
      const result = await submitEvent(payload);
      emitOperationsRefresh();
      setSubmitState({
        loading: false,
        error: null,
        result,
      });

      if (!result.duplicate) {
        setFinance(createFinanceDefaults());
        setCampaign(createCampaignDefaults());
        setGuest(createGuestDefaults());
        setAdvancedJson(createAdvancedJsonDefault());
      }
    } catch (error) {
      setSubmitState({
        loading: false,
        error:
          error instanceof Error ? error.message : "Unable to submit event",
        result: null,
      });
    }
  }

  return (
    <div className="space-y-8">
      <section className="rounded-[24px] border border-[var(--border)] bg-white p-8 shadow-[0_14px_34px_-30px_rgba(15,23,42,0.9)]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
          Submit Event
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-[var(--text)]">
          Create a new event
        </h1>
        <p className="mt-4 max-w-2xl text-[15px] leading-7 text-[var(--text-secondary)]">
          Pick a workflow, fill in the fields, and submit. You will see the result right away, and JSON mode is still there for edge cases.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <MiniStep number="1" title="Choose a workflow" body="Pick FinanceOps, CampaignOps, or GuestOps." />
        <MiniStep number="2" title="Fill the details" body="The forms include sample values so you can test without much typing." />
        <MiniStep number="3" title="Review the result" body="After submit, you’ll see the status, actions, and next step." />
      </section>

      <div className="grid gap-6 xl:grid-cols-[280px_1fr]">
        <section className="rounded-[20px] border border-[var(--border)] bg-white p-5 shadow-[0_10px_26px_-26px_rgba(15,23,42,0.9)]">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
            Choose a workflow
          </p>
          <div className="grid gap-2">
            {tabs.map((tab) => {
              const active = activeTab === tab.key;

              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`rounded-[10px] border px-4 py-3 text-left transition ${
                    active
                      ? "border-[#bfdbfe] bg-[#eff6ff] text-[#1d4ed8]"
                      : "border-[var(--border)] bg-white text-[var(--text-secondary)] hover:bg-[#f9fafb]"
                  }`}
                >
                  <p className="text-sm font-medium">{tab.title}</p>
                  <p className="mt-1 text-xs">{tab.subtitle}</p>
                </button>
              );
            })}
          </div>
          <div className="mt-4 rounded-[14px] border border-[var(--border)] bg-[var(--surface-muted)] p-4 text-sm text-[var(--text-secondary)]">
            Tip: the default values let you submit a working example right away.
          </div>
        </section>

        <div className="space-y-6">
          <section className="rounded-[24px] border border-[var(--border)] bg-white p-6 shadow-[0_14px_34px_-30px_rgba(15,23,42,0.9)]">
            {activeTab === "finance" ? (
              <FinanceForm
                values={finance}
                onChange={setFinance}
                onSubmit={() =>
                  handleSubmission({
                    source_event_id: finance.source_event_id,
                    source: "financeops",
                    event_type: "invoice.overdue",
                    payload: {
                      invoice_id: finance.invoice_id,
                      customer_name: finance.customer_name,
                      amount: Number(finance.amount),
                      currency: finance.currency,
                      days_overdue: Number(finance.days_overdue),
                      simulate_failure: finance.simulate_failure,
                    },
                  })
                }
                loading={submitState.loading}
              />
            ) : null}

            {activeTab === "campaign" ? (
              <CampaignForm
                values={campaign}
                onChange={setCampaign}
                onSubmit={() =>
                  handleSubmission({
                    source_event_id: campaign.source_event_id,
                    source: "campaignops",
                    event_type: "client_brief.received",
                    payload: {
                      client: campaign.client,
                      campaign_goal: campaign.campaign_goal,
                      channels: campaign.channels,
                      deadline: campaign.deadline,
                      simulate_failure: campaign.simulate_failure,
                    },
                  })
                }
                loading={submitState.loading}
              />
            ) : null}

            {activeTab === "guest" ? (
              <GuestForm
                values={guest}
                onChange={setGuest}
                onSubmit={() =>
                  handleSubmission({
                    source_event_id: guest.source_event_id,
                    source: "guestops",
                    event_type: "reservation.change_requested",
                    payload: {
                      reservation_id: guest.reservation_id,
                      guest_name: guest.guest_name,
                      current_check_in: guest.current_check_in,
                      requested_check_in: guest.requested_check_in,
                      nights: Number(guest.nights),
                      simulate_failure: guest.simulate_failure,
                    },
                  })
                }
                loading={submitState.loading}
              />
            ) : null}

            {activeTab === "advanced" ? (
              <AdvancedJsonForm
                value={advancedJson}
                onChange={setAdvancedJson}
                onSubmit={() => handleSubmission(JSON.parse(advancedJson) as unknown)}
                loading={submitState.loading}
              />
            ) : null}
          </section>

          <SubmissionResult state={submitState} />
        </div>
      </div>
    </div>
  );
}

function FinanceForm({
  values,
  onChange,
  onSubmit,
  loading,
}: {
  values: ReturnType<typeof createFinanceDefaults>;
  onChange: (next: ReturnType<typeof createFinanceDefaults>) => void;
  onSubmit: () => void;
  loading: boolean;
}) {
  return (
    <FormLayout
      title="FinanceOps · Overdue Invoice"
      description="Use this when a customer has an overdue invoice and the system should create follow-up work automatically."
    >
      <div className="grid gap-4 md:grid-cols-2">
        <TextField label="source_event_id" value={values.source_event_id} onChange={(value) => onChange({ ...values, source_event_id: value })} />
        <TextField label="invoice_id" value={values.invoice_id} onChange={(value) => onChange({ ...values, invoice_id: value })} />
        <TextField label="customer_name" value={values.customer_name} onChange={(value) => onChange({ ...values, customer_name: value })} />
        <TextField label="currency" value={values.currency} onChange={(value) => onChange({ ...values, currency: value })} />
        <TextField label="amount" type="number" value={values.amount} onChange={(value) => onChange({ ...values, amount: value })} />
        <TextField label="days_overdue" type="number" value={values.days_overdue} onChange={(value) => onChange({ ...values, days_overdue: value })} />
      </div>
      <CheckboxField label="simulate_failure" checked={values.simulate_failure} onChange={(checked) => onChange({ ...values, simulate_failure: checked })} />
      <PrimaryButton onClick={onSubmit} loading={loading} label="Submit FinanceOps event" />
    </FormLayout>
  );
}

function CampaignForm({
  values,
  onChange,
  onSubmit,
  loading,
}: {
  values: ReturnType<typeof createCampaignDefaults>;
  onChange: (next: ReturnType<typeof createCampaignDefaults>) => void;
  onSubmit: () => void;
  loading: boolean;
}) {
  const channels = ["instagram", "email", "landing_page", "tiktok", "google_ads"] as const;

  return (
    <FormLayout
      title="CampaignOps · Client Brief"
      description="Use this when a new client brief comes in and each marketing channel needs its own task."
    >
      <div className="grid gap-4 md:grid-cols-2">
        <TextField label="source_event_id" value={values.source_event_id} onChange={(value) => onChange({ ...values, source_event_id: value })} />
        <TextField label="client" value={values.client} onChange={(value) => onChange({ ...values, client: value })} />
        <TextField label="campaign_goal" value={values.campaign_goal} onChange={(value) => onChange({ ...values, campaign_goal: value })} />
        <TextField label="deadline" type="date" value={values.deadline} onChange={(value) => onChange({ ...values, deadline: value })} />
      </div>
      <div>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">channels</p>
        <div className="grid gap-3 md:grid-cols-2">
          {channels.map((channel) => (
            <label key={channel} className="flex items-center gap-3 rounded-[7px] border border-[#d1d5db] bg-white px-3 py-2.5 text-sm text-[var(--text)]">
              <input
                type="checkbox"
                checked={values.channels.includes(channel)}
                onChange={(event) => {
                  const next = event.target.checked
                    ? [...values.channels, channel]
                    : values.channels.filter((entry) => entry !== channel);
                  onChange({ ...values, channels: next });
                }}
              />
              <span>{channel}</span>
            </label>
          ))}
        </div>
      </div>
      <CheckboxField label="simulate_failure" checked={values.simulate_failure} onChange={(checked) => onChange({ ...values, simulate_failure: checked })} />
      <PrimaryButton onClick={onSubmit} loading={loading} label="Submit CampaignOps event" />
    </FormLayout>
  );
}

function GuestForm({
  values,
  onChange,
  onSubmit,
  loading,
}: {
  values: ReturnType<typeof createGuestDefaults>;
  onChange: (next: ReturnType<typeof createGuestDefaults>) => void;
  onSubmit: () => void;
  loading: boolean;
}) {
  return (
    <FormLayout
      title="GuestOps · Reservation Change"
      description="Use this when a guest wants to change a reservation and the system should prepare the request and response."
    >
      <div className="grid gap-4 md:grid-cols-2">
        <TextField label="source_event_id" value={values.source_event_id} onChange={(value) => onChange({ ...values, source_event_id: value })} />
        <TextField label="reservation_id" value={values.reservation_id} onChange={(value) => onChange({ ...values, reservation_id: value })} />
        <TextField label="guest_name" value={values.guest_name} onChange={(value) => onChange({ ...values, guest_name: value })} />
        <TextField label="nights" type="number" value={values.nights} onChange={(value) => onChange({ ...values, nights: value })} />
        <TextField label="current_check_in" type="date" value={values.current_check_in} onChange={(value) => onChange({ ...values, current_check_in: value })} />
        <TextField label="requested_check_in" type="date" value={values.requested_check_in} onChange={(value) => onChange({ ...values, requested_check_in: value })} />
      </div>
      <CheckboxField label="simulate_failure" checked={values.simulate_failure} onChange={(checked) => onChange({ ...values, simulate_failure: checked })} />
      <PrimaryButton onClick={onSubmit} loading={loading} label="Submit GuestOps event" />
    </FormLayout>
  );
}

function AdvancedJsonForm({
  value,
  onChange,
  onSubmit,
  loading,
}: {
  value: string;
  onChange: (next: string) => void;
  onSubmit: () => void;
  loading: boolean;
}) {
  return (
    <FormLayout
      title="Advanced JSON mode"
      description="Use raw JSON only for edge cases or backend demos. Most normal testing should go through the guided forms."
    >
      <label className="block">
        <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Raw event JSON</span>
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="min-h-[340px] w-full bg-[#f9fafb] p-4 font-mono text-sm"
        />
      </label>
      <PrimaryButton onClick={onSubmit} loading={loading} label="Submit advanced JSON event" />
    </FormLayout>
  );
}

function SubmissionResult({ state }: { state: SubmitState }) {
  if (state.loading) {
    return (
      <section className="rounded-[10px] border border-[var(--border)] bg-white p-5">
        <p className="text-sm text-[var(--text-secondary)]">Submitting event...</p>
      </section>
    );
  }

  if (state.error) {
    return (
      <section className="rounded-[10px] border border-[#fecaca] bg-[#fef2f2] p-5">
        <p className="text-sm font-medium text-[#b91c1c]">{state.error}</p>
      </section>
    );
  }

  if (!state.result) {
    return (
      <section className="rounded-[10px] border border-[var(--border)] bg-white p-5">
        <p className="text-sm text-[var(--text-secondary)]">
          Your result will appear here after you submit an event.
        </p>
      </section>
    );
  }

  const event = state.result.event;

  return (
    <section className="rounded-[10px] border border-[var(--border)] bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
            Submission result
          </p>
          <h2 className="mt-1 text-lg font-semibold text-[var(--text)]">
            {state.result.duplicate ? "We found the existing event" : "Your event was received"}
          </h2>
        </div>
        <StatusBadge status={event.status} />
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <ResultStat label="Workflow" value={getWorkflowLabel(event)} />
        <ResultStat label="Event type" value={event.event_type} />
        <ResultStat label="Actions" value={String(event.actions.length)} />
      </div>
      {event.review_queue_items[0] ? (
        <div className="mt-4 rounded-[10px] border border-[#fde68a] bg-[#fffbeb] px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#b45309]">
            Review reason
          </p>
          <p className="mt-2 text-sm text-[#b45309]">
            {event.review_queue_items[0].reason}
          </p>
        </div>
      ) : null}
      <div className="mt-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
          Generated actions
        </p>
        <div className="mt-3 space-y-3">
          {event.actions.length === 0 ? (
            <div className="rounded-[10px] border border-dashed border-[var(--border)] bg-[#fafafa] px-4 py-5 text-sm text-[var(--text-secondary)]">
              No actions were generated for this submission.
            </div>
          ) : (
            event.actions.map((action) => {
              const actionDisplay = getActionDisplay(action);

              return (
                <div
                  key={action.id}
                  className="rounded-[10px] border border-[var(--border)] bg-[#f9fafb] p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-[var(--text)]">
                        {actionDisplay.title}
                      </h3>
                      {actionDisplay.message ? (
                        <p className="mt-1 text-sm text-[var(--text-secondary)]">
                          {actionDisplay.message}
                        </p>
                      ) : null}
                    </div>
                    <StatusBadge status={action.status} />
                  </div>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    {actionDisplay.fields.map((field) => (
                      <ResultStat
                        key={`${action.id}-${field.label}`}
                        label={field.label}
                        value={field.value}
                      />
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link href={`/events/${event.id}`} className="rounded-[7px] bg-[#2563eb] px-4 py-2 text-sm font-medium text-white">
          Open event detail
        </Link>
        <Link href="/events" className="rounded-[7px] border border-[#d1d5db] bg-white px-4 py-2 text-sm font-medium text-[var(--text)]">
          Go to inbox
        </Link>
      </div>
    </section>
  );
}

function FormLayout({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-5">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
          Current form
        </p>
        <h2 className="mt-1 text-xl font-semibold text-[var(--text)]">{title}</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--text-secondary)]">{description}</p>
      </div>
      {children}
    </div>
  );
}

function MiniStep({
  number,
  title,
  body,
}: {
  number: string;
  title: string;
  body: string;
}) {
  return (
    <section className="rounded-[18px] border border-[var(--border)] bg-white p-5 shadow-[0_10px_26px_-26px_rgba(15,23,42,0.9)]">
      <div className="flex items-center gap-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--surface-muted)] text-sm font-semibold text-[var(--text)]">
          {number}
        </span>
        <h2 className="text-base font-semibold text-[var(--text)]">{title}</h2>
      </div>
      <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">{body}</p>
    </section>
  );
}

function TextField({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">{label}</span>
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="w-full px-3 py-2.5 text-sm" />
    </label>
  );
}

function CheckboxField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-3 rounded-[7px] border border-[#d1d5db] bg-white px-3 py-2.5 text-sm text-[var(--text)]">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <span>{label}</span>
    </label>
  );
}

function PrimaryButton({
  onClick,
  loading,
  label,
}: {
  onClick: () => void;
  loading: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      disabled={loading}
      onClick={onClick}
      className="rounded-[7px] bg-[#2563eb] px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
    >
      {loading ? "Submitting..." : label}
    </button>
  );
}

function ResultStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[10px] border border-[var(--border)] bg-[#f9fafb] p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">{label}</p>
      <p className="mt-2 text-sm font-medium text-[var(--text)]">{value}</p>
    </div>
  );
}
