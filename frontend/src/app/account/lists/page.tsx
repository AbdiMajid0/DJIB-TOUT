import { List } from "lucide-react";

export default function ListsPage() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
      <h1 className="text-xl font-bold text-gray-900 mb-6">
        Toutes mes listes
      </h1>

      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="bg-purple-50 p-6 rounded-full mb-4">
          <List className="h-12 w-12 text-purple-500" />
        </div>
        <h2 className="text-lg font-bold text-gray-700 mb-2">
          Vous n’avez pas encore de listes
        </h2>
        <p className="text-gray-500 text-sm mb-6 max-w-md">
          Créez des listes d’achats personnalisées (ex. : Maison, Anniversaire,
          Courses) pour organiser vos futurs achats.
        </p>
        <button className="bg-[#0052cc] text-white font-bold py-3 px-8 rounded-md hover:bg-[#003d99] transition-colors">
          Créer ma première liste
        </button>
      </div>
    </div>
  );
}
