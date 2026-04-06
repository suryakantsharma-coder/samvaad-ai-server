import { useEffect, useState } from "react";
import { EyeIcon, EyeOffIcon, KeyRound, X } from "lucide-react";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { updateCurrentUserProfile } from "../../data/auth";
import { showSuccess, showError, showWarning } from "../../lib/toast";

interface ChangePasswordModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ChangePasswordModal = ({
  open,
  onOpenChange,
}: ChangePasswordModalProps): JSX.Element => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowNew(false);
    }
  }, [open]);

  const handleClose = () => {
    onOpenChange(false);
  };

  const handleSubmit = async () => {
    const cur = currentPassword.trim();
    const next = newPassword.trim();
    const again = confirmPassword.trim();
    if (!cur) {
      showWarning("Warning", "Enter your current password.");
      return;
    }
    if (!next) {
      showWarning("Warning", "Enter a new password.");
      return;
    }
    if (next !== again) {
      showWarning("Warning", "New password and confirmation do not match.");
      return;
    }
    setLoading(true);
    try {
      await updateCurrentUserProfile({
        password: next,
        currentPassword: cur,
      });
      showSuccess("Success!", "Your password was updated.");
      onOpenChange(false);
    } catch (err) {
      showError(
        "Error",
        err instanceof Error ? err.message : "Failed to change password",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 border-none overflow-hidden gap-0">
        <DialogHeader className="flex flex-row items-center gap-2 p-4 border-b rounded-t-lg bg-[#F6F6F6]">
          <div className="flex items-center gap-2 p-[2px] rounded-[50px] bg-white border border-[#dedee1]">
            <KeyRound className="w-4 h-4 text-black" />
          </div>
          <DialogTitle className="text-sm font-semibold text-gray-700">
            Change password
          </DialogTitle>
        </DialogHeader>
        <div className="px-[25px] pb-[25px] pt-4 space-y-4">
          <p className="text-[14px] leading-relaxed text-gray-600">
            Use a strong password you don&apos;t use elsewhere. You&apos;ll stay
            logged in on this device after updating.
          </p>
          <div className="flex flex-col gap-2">
            <label
              htmlFor="change-pw-current"
              className="text-[12px] font-medium text-gray-700"
            >
              Current password
            </label>
            <Input
              id="change-pw-current"
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="h-9"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label
              htmlFor="change-pw-new"
              className="text-[12px] font-medium text-gray-700"
            >
              New password
            </label>
            <div className="relative">
              <Input
                id="change-pw-new"
                type={showNew ? "text" : "password"}
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="h-9 pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-1/2 -translate-y-1/2 h-8 w-8"
                onClick={() => setShowNew((s) => !s)}
                aria-label={showNew ? "Hide password" : "Show password"}
              >
                {showNew ? (
                  <EyeOffIcon className="w-4 h-4 text-x-70" />
                ) : (
                  <EyeIcon className="w-4 h-4 text-x-70" />
                )}
              </Button>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <label
              htmlFor="change-pw-confirm"
              className="text-[12px] font-medium text-gray-700"
            >
              Confirm new password
            </label>
            <Input
              id="change-pw-confirm"
              type={showNew ? "text" : "password"}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="h-9"
            />
          </div>
          <div className="flex justify-end gap-[20px] pt-2">
            <Button
              type="button"
              variant="ghost"
              className="text-gray-500 text-xs h-9 px-6 bg-[#F5F5F5] text-[14px]"
              onClick={handleClose}
              disabled={loading}
            >
              <X className="w-4 h-4 mr-1" /> Cancel
            </Button>
            <Button
              type="button"
              className="bg-primary-2 hover:bg-primary-2/90 text-white text-xs h-9 px-6 text-[14px]"
              onClick={() => void handleSubmit()}
              disabled={loading}
            >
              {loading ? "Updating…" : "Update password"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
