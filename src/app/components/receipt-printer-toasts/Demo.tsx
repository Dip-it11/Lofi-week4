"use client";

import { ReceiptPrinter, useReceiptPrinter } from "@/components/receipt-printer-toasts";

const BTN =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#351367] active:scale-[.97]";

let nextOrder = 1042;

function Controls() {
  const printer = useReceiptPrinter();
  const buttons: { label: string; hint: string; tone: string; run: () => void }[] = [
    {
      label: "Payment received",
      hint: "success + line items",
      tone: "border-emerald-200 bg-emerald-50 text-emerald-900 hover:bg-emerald-100",
      run: () =>
        printer.success("Payment received", {
          message: `Order #${nextOrder++} is on its way.`,
          items: [
            { label: "Lofi Pro · yearly", value: "$120.00" },
            { label: "Tax", value: "$9.60" },
            { label: "Total", value: "$129.60" },
          ],
        }),
    },
    {
      label: "Card declined",
      hint: "error + retry action",
      tone: "border-red-200 bg-red-50 text-red-900 hover:bg-red-100",
      run: () =>
        printer.error("Card declined", {
          message: "Your bank said no. Try another card or retry in a minute.",
          action: { label: "Retry payment", onClick: () => printer.info("Retrying…", { message: "Sending the payment again.", duration: 2500 }) },
        }),
    },
    {
      label: "Low stock",
      hint: "warning",
      tone: "border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-100",
      run: () => printer.warning("Only 2 left", { message: "Cassette Tape Tabs kit is almost sold out." }),
    },
    {
      label: "Draft saved",
      hint: "info + undo",
      tone: "border-indigo-200 bg-indigo-50 text-indigo-900 hover:bg-indigo-100",
      run: () =>
        printer.info("Draft saved", {
          message: "We kept a copy of your note.",
          action: { label: "Undo", onClick: () => printer.info("Changes undone", { duration: 2500 }) },
        }),
    },
    {
      label: "Pinned note",
      hint: "stays until torn",
      tone: "border-[#e6e0f2] bg-white text-[#351367] hover:bg-[#f4f1fa]",
      run: () => printer.print({ type: "info", title: "Shift starts at 9", message: "This one stays until you tear it off.", duration: 0 }),
    },
    {
      label: "Rush hour ×4",
      hint: "queue: prints one by one",
      tone: "border-[#351367] bg-[#351367] text-white hover:brightness-125",
      run: () => {
        printer.success("Order #2001 paid");
        printer.success("Order #2002 paid");
        printer.warning("Order #2003 delayed", { message: "Courier is running late." });
        printer.success("Order #2004 paid");
      },
    },
  ];

  return (
    <div className="p-4 @xl:p-6">
      <p className="font-mono text-[11px] font-semibold tracking-[0.25em] text-[#351367]/60 uppercase">Corner shop · till</p>
      <h3 className="mt-1 text-xl font-semibold text-[#351367] @xl:text-2xl">Print a notification</h3>
      <p className="mt-1 max-w-md text-sm text-[#5d5275]">Hover the paper to pause and unroll the stack. Swipe a receipt sideways, press ✂ or Esc to tear it off.</p>
      <div className="mt-4 grid grid-cols-2 gap-2 @2xl:grid-cols-3 @4xl:max-w-3xl">
        {buttons.map((b) => (
          <button key={b.label} type="button" onClick={b.run} className={`${BTN} ${b.tone} flex-col !items-start text-left`}>
            <span>{b.label}</span>
            <span className="text-[11px] font-normal opacity-70">{b.hint}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/** A shop "till" panel with the printer pinned to its bottom-right corner. */
export function ReceiptDemo({ height = 720 }: { height?: number }) {
  return (
    <div
      className="@container relative isolate overflow-hidden rounded-xl border border-[#e6e0f2] bg-[radial-gradient(circle_at_20%_0,#f4ecff,transparent_60%),#fbfaff]"
      style={{ height }}
    >
      <ReceiptPrinter contained alwaysShow>
        <Controls />
      </ReceiptPrinter>
    </div>
  );
}
