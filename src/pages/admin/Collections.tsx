import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/contexts/ToastContext';

interface Collection {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  image_url?: string | null;
}

export default function Collections() {
  const { toast } = useToast();

  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Collection | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const loadCollections = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from('collections')
      .select('*')
      .order('name');

    if (error) {
      toast(error.message, 'error');
    } else {
      setCollections((data as Collection[]) || []);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadCollections();
  }, []);

  const resetForm = () => {
    setName('');
    setSlug('');
    setDescription('');
    setImageUrl('');
    setEditing(null);
    setShowForm(false);
  };

  const openAdd = () => {
    resetForm();
    setShowForm(true);
  };

  const openEdit = (collection: Collection) => {
    setEditing(collection);
    setName(collection.name);
    setSlug(collection.slug);
    setDescription(collection.description || '');
    setImageUrl(collection.image_url || '');
    setShowForm(true);
  };

  const saveCollection = async () => {
    if (!name.trim()) {
      toast('Collection name is required', 'error');
      return;
    }

    const finalSlug =
      slug.trim() ||
      name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

    setSaving(true);

    const payload = {
      name: name.trim(),
      slug: finalSlug,
      description: description.trim() || null,
      image_url: imageUrl.trim() || null,
    };

    const { error } = editing
      ? await supabase
          .from('collections')
          .update(payload)
          .eq('id', editing.id)
      : await supabase
          .from('collections')
          .insert(payload);

    setSaving(false);

    if (error) {
      toast(error.message, 'error');
      return;
    }

    toast(editing ? 'Collection updated' : 'Collection created');
    resetForm();
    loadCollections();
  };

  const deleteCollection = async (collection: Collection) => {
    const confirmed = window.confirm(
      `Delete "${collection.name}" collection?`
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from('collections')
      .delete()
      .eq('id', collection.id);

    if (error) {
      toast(error.message, 'error');
      return;
    }

    toast('Collection deleted');
    loadCollections();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl text-white">
            Collections
          </h1>

          <p className="mt-1 text-sm text-ink-400">
            {collections.length} collections
          </p>
        </div>

        <button onClick={openAdd} className="btn-solid">
          <Plus size={16} />
          Add Collection
        </button>
      </div>

      {loading ? (
        <p className="text-ink-500">Loading...</p>
      ) : collections.length === 0 ? (
        <div className="border border-ink-800 bg-black-card p-12 text-center">
          <p className="text-sm text-ink-400">
            No collections yet.
          </p>

          <button onClick={openAdd} className="btn-outline mt-5">
            <Plus size={14} />
            Create First Collection
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto border border-ink-800 bg-black-card">
          <table className="w-full text-sm">
            <thead className="border-b border-ink-800 text-left text-xs uppercase tracking-wide-sm text-ink-500">
              <tr>
                <th className="p-4">Name</th>
                <th className="p-4">Slug</th>
                <th className="p-4">Description</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody>
              {collections.map((collection) => (
                <tr
                  key={collection.id}
                  className="border-b border-ink-800/60 last:border-0"
                >
                  <td className="p-4 font-medium text-white">
                    {collection.name}
                  </td>

                  <td className="p-4 text-ink-400">
                    {collection.slug}
                  </td>

                  <td className="p-4 text-ink-400">
                    {collection.description || '—'}
                  </td>

                  <td className="p-4">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => openEdit(collection)}
                        className="grid h-8 w-8 place-items-center border border-ink-700 text-ink-300 hover:border-gold hover:text-gold"
                      >
                        <Pencil size={14} />
                      </button>

                      <button
                        onClick={() => deleteCollection(collection)}
                        className="grid h-8 w-8 place-items-center border border-ink-700 text-ink-300 hover:border-rose-500 hover:text-rose-400"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-4"
          onClick={resetForm}
        >
          <div
            className="w-full max-w-lg border border-ink-700 bg-black-deep p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-2xl text-white">
                {editing ? 'Edit Collection' : 'Add Collection'}
              </h2>

              <button onClick={resetForm}>
                <X size={20} className="text-ink-400" />
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <label className="mb-2 block text-xs uppercase text-ink-400">
                  Collection Name
                </label>

                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Summer Collection"
                  className="kx-input w-full"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs uppercase text-ink-400">
                  Slug
                </label>

                <input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="summer-collection"
                  className="kx-input w-full"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs uppercase text-ink-400">
                  Description
                </label>

                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Collection description..."
                  rows={4}
                  className="kx-input w-full"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs uppercase text-ink-400">
                  Image URL
                </label>

                <input
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://..."
                  className="kx-input w-full"
                />
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={saveCollection}
                disabled={saving}
                className="btn-solid flex-1"
              >
                {saving
                  ? 'Saving...'
                  : editing
                    ? 'Update Collection'
                    : 'Create Collection'}
              </button>

              <button
                onClick={resetForm}
                className="btn-outline"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
