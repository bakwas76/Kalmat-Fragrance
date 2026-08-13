import { useEffect, useRef, useState } from 'react';
import { Plus, Pencil, Trash2, X, Upload, Image as ImageIcon } from 'lucide-react';
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
  const [uploading, setUploading] = useState(false);
  const [editing, setEditing] = useState<Collection | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

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
    setImageUrl(null);
    setEditing(null);
    setShowForm(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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
    setImageUrl(collection.image_url || null);
    setShowForm(true);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast('Please select an image file', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast('Image must be under 5MB', 'error');
      return;
    }

    setUploading(true);

    const safeName =
      name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') || 'collection';

    const ext = file.name.split('.').pop() || 'jpg';

    const fileName = `collections/${safeName}-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) {
      setUploading(false);
      toast(`Upload failed: ${uploadError.message}`, 'error');
      return;
    }

    const { data: publicUrlData } = supabase.storage
      .from('product-images')
      .getPublicUrl(fileName);

    setImageUrl(publicUrlData.publicUrl);
    setUploading(false);

    toast('Collection image uploaded');
  };

  const removeImage = () => {
    setImageUrl(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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

    if (!finalSlug) {
      toast('Please enter a valid collection name', 'error');
      return;
    }

    setSaving(true);

    const payload = {
      name: name.trim(),
      slug: finalSlug,
      description: description.trim() || null,
      image_url: imageUrl || null,
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl text-white">
            Collections
          </h1>

          <p className="mt-1 text-sm text-ink-400">
            {collections.length} collections
          </p>
        </div>

        <button
          onClick={openAdd}
          className="btn-solid flex items-center gap-2"
        >
          <Plus size={16} />
          Add Collection
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <p className="text-ink-400">Loading...</p>
      ) : collections.length === 0 ? (
        <div className="border border-ink-800 bg-black-card p-12 text-center">
          <p className="text-sm text-ink-400">
            No collections yet.
          </p>

          <button
            onClick={openAdd}
            className="btn-outline mt-5 flex items-center gap-2 mx-auto"
          >
            <Plus size={14} />
            Create First Collection
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto border border-ink-800 bg-black-card">
          <table className="w-full text-sm">
            <thead className="border-b border-ink-800 text-left text-xs uppercase tracking-wide-sm text-ink-500">
              <tr>
                <th className="p-4">Image</th>
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
                  {/* Image */}
                  <td className="p-4">
                    <div className="h-12 w-16 overflow-hidden border border-ink-700 bg-black-soft">
                      {collection.image_url ? (
                        <img
                          src={collection.image_url}
                          alt={collection.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="grid h-full w-full place-items-center text-ink-600">
                          <ImageIcon size={18} />
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Name */}
                  <td className="p-4 font-medium text-white">
                    {collection.name}
                  </td>

                  {/* Slug */}
                  <td className="p-4 text-ink-300">
                    {collection.slug}
                  </td>

                  {/* Description */}
                  <td className="p-4 text-ink-300">
                    {collection.description || '—'}
                  </td>

                  {/* Actions */}
                  <td className="p-4">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => openEdit(collection)}
                        className="grid h-8 w-8 place-items-center border border-ink-700 text-ink-300 hover:border-gold hover:text-gold"
                        aria-label="Edit collection"
                      >
                        <Pencil size={14} />
                      </button>

                      <button
                        onClick={() => deleteCollection(collection)}
                        className="grid h-8 w-8 place-items-center border border-ink-700 text-ink-300 hover:border-rose-500 hover:text-rose-400"
                        aria-label="Delete collection"
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

      {/* Add/Edit Modal */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/80 p-4"
          onClick={resetForm}
        >
          <div
            className="my-8 w-full max-w-lg border border-ink-700 bg-black-deep p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-2xl text-white">
                {editing ? 'Edit Collection' : 'Add Collection'}
              </h2>

              <button
                onClick={resetForm}
                className="text-ink-400 transition-colors hover:text-white"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mt-6 space-y-5">
              {/* Collection Name */}
              <div>
                <label className="mb-2 block text-xs uppercase tracking-wide-sm text-ink-300">
                  Collection Name
                </label>

                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Summer Collection"
                  className="w-full border border-ink-700 bg-black-soft px-3 py-3 text-white placeholder:text-ink-500 focus:border-gold focus:outline-none"
                />
              </div>

              {/* Slug */}
              <div>
                <label className="mb-2 block text-xs uppercase tracking-wide-sm text-ink-300">
                  Slug
                </label>

                <input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="summer-collection"
                  className="w-full border border-ink-700 bg-black-soft px-3 py-3 text-white placeholder:text-ink-500 focus:border-gold focus:outline-none"
                />

                <p className="mt-1 text-xs text-ink-500">
                  Leave empty to generate automatically.
                </p>
              </div>

              {/* Description */}
              <div>
                <label className="mb-2 block text-xs uppercase tracking-wide-sm text-ink-300">
                  Description
                </label>

                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Collection description..."
                  rows={4}
                  className="w-full resize-none border border-ink-700 bg-black-soft px-3 py-3 text-white placeholder:text-ink-500 focus:border-gold focus:outline-none"
                />
              </div>

              {/* Image Upload */}
              <div>
                <label className="mb-2 block text-xs uppercase tracking-wide-sm text-ink-300">
                  Collection Image
                </label>

                <div className="flex items-center gap-4">
                  {/* Preview */}
                  <div className="h-24 w-32 shrink-0 overflow-hidden border border-ink-700 bg-black-soft">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt="Collection preview"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="grid h-full w-full place-items-center text-ink-600">
                        <ImageIcon size={28} />
                      </div>
                    )}
                  </div>

                  {/* Upload controls */}
                  <div className="flex flex-col gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="btn-outline flex items-center gap-2 text-sm"
                    >
                      <Upload size={14} />

                      {uploading
                        ? 'Uploading...'
                        : imageUrl
                          ? 'Replace Image'
                          : 'Upload Image'}
                    </button>

                    {imageUrl && (
                      <button
                        type="button"
                        onClick={removeImage}
                        className="text-left text-xs text-ink-400 hover:text-rose-300"
                      >
                        Remove image
                      </button>
                    )}
                  </div>
                </div>

                <p className="mt-2 text-xs text-ink-500">
                  JPG, PNG or WebP. Maximum 5MB.
                </p>
              </div>
            </div>

            {/* Buttons */}
            <div className="mt-7 flex gap-3">
              <button
                onClick={saveCollection}
                disabled={saving || uploading}
                className="btn-solid flex-1 disabled:cursor-not-allowed disabled:opacity-50"
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
