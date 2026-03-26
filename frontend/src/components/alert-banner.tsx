type Props = {
  message: string;
  onClose: () => void;
};

export function AlertBanner({ message, onClose }: Props) {
  if (!message) return null;
  return (
    <div className="flex items-center justify-between rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
      <span>{message}</span>
      <button onClick={onClose} className="ml-4 font-medium hover:opacity-70">
        ✕
      </button>
    </div>
  );
}
