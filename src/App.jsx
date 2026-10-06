import JoinForm from './views/JoinForm.jsx';
import Host from './views/Host.jsx';
import ForestBackdrop from './components/ForestBackdrop.jsx';

export default function App() {
  const isJoin = window.location.pathname.startsWith('/join');
  return (
    <>
      <ForestBackdrop />
      {isJoin ? <JoinForm /> : <Host />}
    </>
  );
}
