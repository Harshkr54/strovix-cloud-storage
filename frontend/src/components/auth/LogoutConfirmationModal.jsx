import { LogOut } from 'lucide-react';
import { ConfirmModal } from '../common/ui.jsx';

export function LogoutConfirmationModal({ open, onClose, onConfirm }) {
  return (
    <ConfirmModal
      open={open}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Logout"
      message="Are you sure you want to logout?"
      confirmLabel="Logout"
      danger
      icon={LogOut}
    />
  );
}

export default LogoutConfirmationModal;
