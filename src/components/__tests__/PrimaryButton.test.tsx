import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PrimaryButton } from "../PrimaryButton";

describe("PrimaryButton", () => {
  it("activates onClick via pointer/click when enabled", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<PrimaryButton onClick={onClick}>Comprobar</PrimaryButton>);

    await user.click(screen.getByRole("button", { name: "Comprobar" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("blocks activation when disabled", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <PrimaryButton onClick={onClick} disabled>
        Comprobar
      </PrimaryButton>,
    );

    const button = screen.getByRole("button", { name: "Comprobar" });
    expect(button).toBeDisabled();
    await user.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("meets the >=60x60 CSS px touch target", () => {
    render(<PrimaryButton onClick={() => {}}>Jugar</PrimaryButton>);
    const button = screen.getByRole("button", { name: "Jugar" });
    expect(button.style.minWidth).toBe("60px");
    expect(button.style.minHeight).toBe("60px");
  });
});
