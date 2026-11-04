import { isRouteErrorResponse, useRouteError } from 'react-router-dom';

// Ловит ошибки рендера и падения lazy-чанков (например, после деплоя новой версии)
export default function RouteError() {
  const error = useRouteError();
  const isChunk = /dynamically imported module|Loading chunk/i.test(error?.message ?? '');
  console.error(error);

  return (
    <div className="min-h-screen grid place-items-center bg-slate-950 px-4 text-center text-slate-100">
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold">Что-то пошло не так</h1>
        <p className="text-slate-400">
          {isChunk
            ? 'Вышла новая версия сайта. Обновите страницу.'
            : isRouteErrorResponse(error)
              ? `Ошибка ${error.status}`
              : 'Произошла непредвиденная ошибка.'}
        </p>
        <button onClick={() => window.location.reload()} className="rounded bg-indigo-600 px-4 py-2 text-white">
          Повторить
        </button>
      </div>
    </div>
  );
}