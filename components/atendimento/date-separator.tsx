interface DateSeparatorProps {
  date: string;
}

export function DateSeparator({ date }: DateSeparatorProps) {
  return (
    <div className="flex justify-center my-4">
      <div className="bg-white/90 shadow-sm rounded-lg px-3 py-1 text-xs text-slate-600 font-medium">
        {date}
      </div>
    </div>
  );
}
