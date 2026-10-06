import JoinForm from './views/JoinForm.jsx';
import Host from './views/Host.jsx';

function Backdrop() {
  return (
    <div className="backdrop" aria-hidden="true">
      <span />
      <span />
      <span />
    </div>
  );
}

export default function App() {
  const isJoin = window.location.pathname.startsWith('/join');
  return (
    <>
      <Backdrop />
      {isJoin ? <JoinForm /> : <Host />}
    </>
  );
}
