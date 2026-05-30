import { type ButtonHTMLAttributes, forwardRef } from "react";

export type ToggleProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "onChange" | "type"
> & {
  checked: boolean;
  onCheckedChange: (next: boolean) => void;
};

/* iOS-style on/off switch (46x28 track, 22px knob). Stops click propagation
   so it can nest inside an accordion header/row without toggling the row.
   Accessible: role=switch + aria-checked, keyboard-activatable as a button. */
export const Toggle = forwardRef<HTMLButtonElement, ToggleProps>(
  ({ checked, onCheckedChange, className = "", disabled, ...props }, ref) => {
    const track = checked ? "bg-primary-500" : "bg-surface-elevated";
    const justify = checked ? "justify-end" : "justify-start";
    const classes = [
      "inline-flex h-[28px] w-[46px] shrink-0 items-center rounded-full p-[3px]",
      "transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60",
      track,
      justify,
      className,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <button
        ref={ref}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        className={classes}
        onClick={(event) => {
          event.stopPropagation();
          onCheckedChange(!checked);
        }}
        {...props}
      >
        <span className="h-[22px] w-[22px] rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.4)] transition-transform duration-200" />
      </button>
    );
  }
);

Toggle.displayName = "Toggle";
