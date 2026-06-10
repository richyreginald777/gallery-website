import AddArtForm from "./AddArtForm";

export default function AdminHome() {
  return (
    <div className="mx-auto max-w-lg">
      <h1 className="font-serif text-2xl mb-6">Add new art</h1>
      <AddArtForm />
    </div>
  );
}
