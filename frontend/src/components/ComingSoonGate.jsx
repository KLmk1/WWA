import { Outlet, useLocation } from 'react-router-dom';
import { EVENT } from '../config/event.js';
import ComingSoon from './ui/ComingSoon.jsx';

const TITLES = {
  cup: 'Новогодний Кубок',
  awards: 'WWAwards',
  quiz: 'Новогодний квиз',
};

// Оборачивает группу маршрутов: пока раздел закрыт флагом в config/event.js,
// вместо страницы показывается COMING SOON. Сами страницы не рендерятся и не делают запросов.
export default function ComingSoonGate() {
  const { pathname } = useLocation();
  const section = pathname.split('/')[1];

  if (EVENT.comingSoon?.[section]) return <ComingSoon title={TITLES[section]} />;
  return <Outlet />;
}