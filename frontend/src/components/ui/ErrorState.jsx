export default function ErrorState({ onRetry, text = 'Не удалось загрузить данные. Проверьте соединение.' }) {
  return (
    <div role="alert" className="rounded-lg border border-red-500/40 bg-red-500/10 p-6 text-center space-y-3">
      <p className="text-red-200">{text}</p>
      {onRetry && (
        <button onClick={onRetry} className="rounded bg-indigo-600 px-4 py-2 text-white">
          Повторить
        </button>
      )}
    </div>
  );
}