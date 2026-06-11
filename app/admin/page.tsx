import AddArtForm from "./AddArtForm";

export default function AdminHome() {
  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-7 font-serif text-3xl tracking-tight text-ink">
        Add new art
      </h1>
      <AddArtForm />
    </div>
  );
}
