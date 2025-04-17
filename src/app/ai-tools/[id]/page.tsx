import { getAiToolData } from "@/lib/posts";
import AiToolClient from "@/components/AiToolClient";

type Params = {
  params: { id: string };
};

export default async function AiToolDetailPage({ params }: Params) {
  const { id } = await params;
  const aiTool = await getAiToolData(id);

  if (!aiTool) {
    return <div>Error: AI Tool not found</div>;
  }

  return <AiToolClient aiTool={aiTool} />;
}
