import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NumberCard } from "../NumberCard";

const baseProps = {
  optionId: "opt-0",
  value: 3,
  tokenEmoji: "⭐",
  onToggle: () => {},
};

describe("NumberCard", () => {
  it("toggles via pointer/click and exposes aria-pressed", async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    const { rerender } = render(
      <NumberCard {...baseProps} selected={false} onToggle={onToggle} />,
    );

    const card = screen.getByRole("button", { pressed: false });
    await user.click(card);
    expect(onToggle).toHaveBeenCalledWith("opt-0");

    // When the parent flips `selected`, aria-pressed reflects it.
    rerender(<NumberCard {...baseProps} selected onToggle={onToggle} />);
    expect(screen.getByRole("button", { pressed: true })).toBeInTheDocument();
  });

  it("does not activate on hover (click/pointer only)", async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    render(<NumberCard {...baseProps} selected={false} onToggle={onToggle} />);

    await user.hover(screen.getByRole("button"));
    expect(onToggle).not.toHaveBeenCalled();
  });

  it("does not toggle when disabled", async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    render(
      <NumberCard {...baseProps} selected={false} disabled onToggle={onToggle} />,
    );

    await user.click(screen.getByRole("button"));
    expect(onToggle).not.toHaveBeenCalled();
  });
});
