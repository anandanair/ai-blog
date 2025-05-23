import CategoriesClient from "@/components/CategoriesClient";
import { getAllCategoriesSortedByPostCount } from "@/lib/posts";

export const metadata = {
  title: "All Categories - Your Blog Name",
  description: "Browse all categories on our blog",
};

export default async function CategoriesPage() {
  const categories = await getAllCategoriesSortedByPostCount();

  return <CategoriesClient categories={categories} />;
}
