import { MessageSquare } from "lucide-react";
import Link from "next/link";

export default function QuestionsPage() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
      <h1 className="text-xl font-bold text-gray-900 mb-6">
        Mes Questions et Demandes
      </h1>

      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="bg-blue-50 p-6 rounded-full mb-4">
          <MessageSquare className="h-12 w-12 text-[#0052cc]" />
        </div>
        <h2 className="text-lg font-bold text-gray-700 mb-2">
          Aucune question pour le moment
        </h2>
        <p className="text-gray-500 text-sm mb-6 max-w-md">
          Vous n’avez pas encore posé de question aux vendeurs ou à notre
          service client. Si vous avez besoin d’aide concernant un produit,
          n’hésitez pas !
        </p>
        <Link
          href="/"
          className="bg-[#0052cc] text-white font-bold py-3 px-8 rounded-md hover:bg-[#003d99] transition-colors"
        >
          Retour à l’accueil
        </Link>
      </div>
    </div>
  );
}
