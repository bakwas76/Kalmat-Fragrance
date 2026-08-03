import { useEffect, useRef, useState } from 'react';
import { Plus, Pencil, Trash2, X, AlertCircle, Upload, Image as ImageIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Category } from '@/types';
import { slugify } from '@/lib/format';
import { useToast } from '@/contexts/ToastContext';

export default function AdminCategories() {
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<Category | null>(null);
  const [saving, setSaving] = useState(false);

  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('categories').select('*').order('name');
    setCategories((data as Category[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null); setName(''); setDescription(''); setImageUrl(null); setShowForm(true);
  };
  const openEdit = (c: Category) => {
    setEditing(c); setName(c.name); setDescription(c.description || ''); setImageUrl(c.image_url); setShowForm(true);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
    const ext = file.name.split('.').pop() || 'jpg';
    const fileName = `${slugify(name || editing?.name || 'category')}-${Date.now()}.${ext}`;
    const filePath = `${fileName}`;

    const { error: upErr } = await supabase.storage
      .from('category-images')
      .upload(filePath, file, { cacheControl: '3600', upsert: true });

    if (upErr) {
      setUploading(false);
      toast(`Upload failed: ${upErr.message}`, 'error');
      return;
    }

    const { data: pub } = supabase.storage.from('category-images').getPublicUrl(filePath);
    setUploading(false);
    setImageUrl(pub.publicUrl);
    toast('Image uploaded');
  };

  const removeImage = () => {
    setImageUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    const payload = {
      name: name.trim(),
      slug: editing ? editing.slug : slugify(name),
      description: description.trim() || null,
      image_url: imageUrl,
    };
    const { error } = editing
      ? await supabase.from('categories').update(payload).eq('id', editing.id)
      : await supabase.from('categories').insert(payload);
    setSaving(false);
    if (error) { toast(error.message, 'error'); return; }
    toast(editing ? 'Category updated' : 'Category created');
    setShowForm(false);
    load();
  };

  const doDelete = async () => {
    if (!confirmDelete) return;
    const { error } = await supabase.from('categories').delete().eq('id', confirmDelete.id);
    if (error) { toast(error.message, 'error'); return; }
    toast('Category deleted');
    setConfirmDelete(null);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl text-white">Categories</h1>
          <p className="mt-1 text-sm text-ink-400">{categories.length} categories</p>
        </div>
        <button onClick={openCreate} className="btn-gold"><Plus size={16} /> Add Category</button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <p className="text-ink-500">Loading...</p>
        ) : categories.length === 0 ? (
          <p className="text-ink-500">No categories yet.</p>
        ) : (
          categories.map((c) => (
            <div key={c.id} className="border border-ink-800 bg-black-card p-5">
              <div className="flex items-start gap-4">
                <div className="h-16 w-16 shrink-0 overflow-hidden border border-ink-700 bg-black-soft">
                  {c.image_url ? (
                    <img src={c.image_url} alt={c.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-ink-600">
                      <ImageIcon size={20} />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0">
                      <h3 className="truncate font-serif text-lg text-white">{c.name}</h3>
                      <p className="text-xs text-ink-500">/{c.slug}</p>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <button onClick={() => openEdit(c)} className="grid h-8 w-8 place-items-center border border-ink-700 text-ink-300 hover:border-gold hover:text-gold"><Pencil size={14} /></button>
                      <button onClick={() => setConfirmDelete(c)} className="grid h-8 w-8 place-items-center border border-ink-700 text-ink-300 hover:border-rose-500 hover:text-rose-400"><Trash2 size={14} /></button>
                    </div>
                  </div>
                  {c.description && <p className="mt-2 line-clamp-2 text-sm text-ink-400">{c.description}</p>}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-4" onClick={() => setShowForm(false)}>
          <form onSubmit={save} className="max-h-[90vh] w-full max-w-md overflow-y-auto border border-ink-700 bg-black-deep p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-xl text-white">{editing ? 'Edit Category' : 'New Category'}</h2>
              <button type="button" onClick={() => setShowForm(false)} className="text-ink-400 hover:text-gold"><X size={20} /></button>
            </div>
            <div className="mt-5 space-y-4">
              {/* Image upload */}
              <div>
                <label className="label-luxe">Category Image</label>
                <div className="mt-2 flex items-center gap-4">
                  <div className="h-24 w-24 shrink-0 overflow-hidden border border-ink-700 bg-black-soft">
                    {imageUrl ? (
                      <img src={imageUrl} alt="Preview" className="h-full w-full object-cover" />
                    ) : (
                      <div className="grid h-full w-full place-items-center text-ink-600">
                        <ImageIcon size={28} />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="btn-outline flex items-center gap-2"
                    >
                      {uploading ? (
                        <>Uploading…</>
                      ) : (
                        <><Upload size={14} /> {imageUrl ? 'Replace Image' : 'Upload Image'}</>
                      )}
                    </button>
                    {imageUrl && (
                      <button type="button" onClick={removeImage} className="text-xs text-ink-400 hover:text-rose-300">
                        Remove image
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="label-luxe">Name</label>
                <input value={name} onChange={(e) => setName(e.target.value)} className="input-luxe" required />
              </div>
              <div>
                <label className="label-luxe">Description</label>
                <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} className="input-luxe resize-none" />
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button type="submit" disabled={saving} className="btn-gold flex-1">{saving ? 'Saving...' : 'Save'}</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-outline">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-4" onClick={() => setConfirmDelete(null)}>
          <div className="max-w-sm border border-ink-700 bg-black-deep p-6" onClick={(e) => e.stopPropagation()}>
            <AlertCircle className="h-10 w-10 text-rose-400" />
            <h3 className="mt-4 font-serif text-xl text-white">Delete category?</h3>
            <p className="mt-2 text-sm text-ink-400">"{confirmDelete.name}" will be removed. Products in this category will be uncategorized.</p>
            <div className="mt-6 flex gap-3">
              <button onClick={doDelete} className="flex-1 border border-rose-500/50 bg-rose-500/10 py-3 text-xs uppercase tracking-wide-sm text-rose-300 hover:bg-rose-500/20">Delete</button>
              <button onClick={() => setConfirmDelete(null)} className="btn-outline flex-1">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
