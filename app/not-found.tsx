import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <h2 className="text-2xl font-bold mb-2">Página não encontrada</h2>
      <p className="text-slate-500 mb-4">A página que você procura não existe ou foi movida.</p>
      <Link
        href="/"
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        Voltar ao início
      </Link>
    </div>
  );
}
