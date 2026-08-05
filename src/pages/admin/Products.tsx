import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Plus, Pencil, Trash2, X, Search, AlertCircle, Upload, Image as ImageIcon, ArrowUp, ArrowDown, Star } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Product, Category, Collection, Gender, ProductVariant } from '@/types';
import { formatPrice, slugify } from '@/lib/format';
import { useToast } from '@/contexts/ToastContext';
import ImagePlaceholder from '@/components/ImagePlaceholder';

const BOTTLE_SHAPES = ['classic', 'flask', 'round', 'square'];
const GLASS_COLORS = ['#120a1f', '#2a1a2e', '#0d0d0d', '#1a1a2e', '#1f2a1a', '#2e0a1a', '#0a1f2a'];
const GENDERS: Gender[] = ['men', 'women', 'unisex'];

interface ProductForm {
  name: string;
  description: string;
  category_id: string;
  collection_id: string;
  brand: string;
  gender: Gender;
  volume_ml: string;
  featured: boolean;
  best_seller: boolean;
  is_new: boolean;
  top_notes: string;
  middle_notes: string;
  base_notes: string;
  ingredients: string;
  bottle_shape: string;
  bottle_glass: string;
  bottle_cap: string;
  bottle_label: string;
  sku: string;
}

interface VariantDraft {
  id: string;
  size_label: string;
  volume_ml: string;
  price: string;
  compare_at_price: string;
  stock: string;
  sku: string;
  weight: string;
  is_default: boolean;
}

function emptyVariant(sortOrder: number, isDefault = false): VariantDraft {
  return {
    id: crypto.randomUUID(),
    size_label: '',
    volume_ml: '100',
    price: '',
    compare_at_price: '',
    stock: '0',
    sku: '',
    weight: '',
    is_default: isDefault,
  };
}

function variantToDraft(v: ProductVariant): VariantDraft {
  return {
    id: v.id,
    size_label: v.size_label,
    volume_ml: String(v.volume_ml),
    price: String(v.price),
    compare_at_price: v.compare_at_price ? String(v.compare_at_price) : '',
    stock: String(v.stock),
    sku: v.sku || '',
    weight: v.weight || '',
    is_default: v.is_default,
  };
}

export default function AdminProducts() {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [variants, setVariants] = useState<VariantDraft[]>([]);
  const [existingVariantIds, setExistingVariantIds] = useState<string[]>([]);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ProductForm>();

  const load = async () => {
    setLoading(true);
    const [prods, cats, cols] = await Promise.all([
      supabase.from('products').select('*').order('created_at', { ascending: false }),
      supabase.from('categories').select('*'),
      supabase.from('collections').select('*'),
    ]);
    setProducts((prods.data as Product[]) || []);
    setCategories((cats.data as Category[]) || []);
    setCollections((cols.data as Collection[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setImageUrl(null);
    setVariants([emptyVariant(0, true)]);
    setExistingVariantIds([]);
    reset({
      name: '', description: '', category_id: '', collection_id: '',
      brand: 'Kalmat Fragrance', gender: 'unisex', volume_ml: '100',
      featured:false, best_seller:false, is_new:false,
      top_notes: '', middle_notes: '', base_notes: '', ingredients: '',
      bottle_shape: 'classic', bottle_glass: '#1a1a2e', bottle_cap: '#C9A227', bottle_label: '#C9A227', sku: '',
    });
    setShowForm(true);
  };

  const openEdit = async (p: Product) => {
    setEditing(p);
    setImageUrl(p.image_url);
    reset({
      name: p.name, description: p.description,
      category_id: p.category_id || '', collection_id: p.collection_id || '',
      brand: p.brand, gender: p.gender, volume_ml: String(p.volume_ml),
      featured:p.featured,
      best_seller:p.best_seller,
      is_new:p.is_new,
      top_notes: p.top_notes.join(', '), middle_notes: p.middle_notes.join(', '), base_notes: p.base_notes.join(', '),
      ingredients: p.ingredients || '',
      bottle_shape: p.bottle_shape, bottle_glass: p.bottle_glass, bottle_cap: p.bottle_cap, bottle_label: p.bottle_label,
      sku: p.sku || '',
    });
    const { data: vData } = await supabase
      .from('product_variants')
      .select('*')
      .eq('product_id', p.id)
      .order('sort_order', { ascending: true });
    const vList = (vData as ProductVariant[]) || [];
    setExistingVariantIds(vList.map((v) => v.id));
    setVariants(vList.length > 0 ? vList.map(variantToDraft) : [emptyVariant(0, true)]);
    setShowForm(true);
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
    const fileName = `${slugify(name || editing?.name || 'product')}-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from('product-images')
      .upload(fileName, file, { cacheControl: '3600', upsert: true });
    if (upErr) {
      setUploading(false);
      toast(`Upload failed: ${upErr.message}`, 'error');
      return;
    }
    const { data: pub } = supabase.storage.from('product-images').getPublicUrl(fileName);
    setUploading(false);
    setImageUrl(pub.publicUrl);
    toast('Image uploaded');
  };

  const removeImage = () => {
    setImageUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Variant helpers
  const addVariant = () => {
    setVariants((prev) => [...prev, emptyVariant(prev.length)]);
  };

  const removeVariant = (id: string) => {
    setVariants((prev) => {
      if (prev.length <= 1) return prev;
      const next = prev.filter((v) => v.id !== id);
      if (!next.some((v) => v.is_default) && next.length > 0) {
        next[0].is_default = true;
      }
      return next;
    });
  };

  const moveVariant = (index: number, dir: -1 | 1) => {
    setVariants((prev) => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const setDefaultVariant = (id: string) => {
    setVariants((prev) => prev.map((v) => ({ ...v, is_default: v.id === id })));
  };

  const updateVariant = (id: string, field: keyof VariantDraft, value: string | boolean) => {
    setVariants((prev) => prev.map((v) => (v.id === id ? { ...v, [field]: value } : v)));
  };

  const onSubmit = async (data: ProductForm) => {
    // Validate variants
    const validVariants = variants.filter((v) => v.size_label.trim() && v.price);
    if (validVariants.length === 0) {
      toast('At least one variant with a size and price is required', 'error');
      return;
    }
    const hasDefault = validVariants.some((v) => v.is_default);
    if (!hasDefault) validVariants[0].is_default = true;

    setSaving(true);

    const defaultVariant = validVariants.find((v) => v.is_default) || validVariants[0];
    const payload = {
      name: data.name,
      slug: editing ? editing.slug : slugify(data.name),
      description: data.description,
      price: parseFloat(defaultVariant.price),
      compare_at_price: defaultVariant.compare_at_price ? parseFloat(defaultVariant.compare_at_price) : null,
      category_id: data.category_id || null,
      collection_id: data.collection_id || null,
      brand: data.brand,
      gender: data.gender,
      volume_ml: parseInt(data.volume_ml, 10),
      stock: validVariants.reduce((sum, v) => sum + (parseInt(v.stock, 10) || 0), 0),
      featured: data.featured,
      best_seller: data.best_seller,
      is_new: data.is_new,
      top_notes: data.top_notes.split(',').map((s) => s.trim()).filter(Boolean),
      middle_notes: data.middle_notes.split(',').map((s) => s.trim()).filter(Boolean),
      base_notes: data.base_notes.split(',').map((s) => s.trim()).filter(Boolean),
      ingredients: data.ingredients || null,
      bottle_shape: data.bottle_shape,
      bottle_glass: data.bottle_glass,
      bottle_cap: data.bottle_cap,
      bottle_label: data.bottle_label,
      sku: data.sku || null,
      image_url: imageUrl,
    };

    let productId: string;
    if (editing) {
      const { error } = await supabase.from('products').update(payload).eq('id', editing.id);
      if (error) {
        setSaving(false);
        toast(error.message, 'error');
        return;
      }
      productId = editing.id;
    } else {
      const { data: created, error } = await supabase.from('products').insert(payload).select().single();
      if (error) {
        setSaving(false);
        toast(error.message, 'error');
        return;
      }
      productId = (created as Product).id;
    }

    // Sync variants

const incomingIds = validVariants.map((v) => v.id);

// Delete removed variants
const toDelete = existingVariantIds.filter((id) => !incomingIds.includes(id));

if (toDelete.length > 0) {
  await supabase
    .from("product_variants")
    .delete()
    .in("id", toDelete);
}

// Insert / Update variants
for (let i = 0; i < validVariants.length; i++) {
  const v = validVariants[i];

  const vPayload = {
    product_id: productId,
    size_label: v.size_label,
    volume_ml: parseInt(v.volume_ml) || 0,
    price: parseFloat(v.price) || 0,
    compare_at_price: v.compare_at_price
      ? parseFloat(v.compare_at_price)
      : null,
    stock: parseInt(v.stock) || 0,
    sku: v.sku || null,
    weight: v.weight || null,
    sort_order: i,
    is_default: v.is_default,
  };

  if (existingVariantIds.includes(v.id)) {
    const { error } = await supabase
      .from("product_variants")
      .update(vPayload)
      .eq("id", v.id);

    if (error) {
      toast(error.message, "error");
      setSaving(false);
      return;
    }
  } else {
    const { error } = await supabase
      .from("product_variants")
      .insert(vPayload);

    if (error) {
      toast(error.message, "error");
      setSaving(false);
      return;
    }
  }
}

    setSaving(false);
    toast(editing ? 'Product updated' : 'Product created');
    setShowForm(false);
    load();
  };

  const doDelete = async () => {
    if (!confirmDelete) return;
    const { error } = await supabase.from('products').delete().eq('id', confirmDelete.id);
    if (error) {
      toast(error.message, 'error');
      return;
    }
    toast('Product deleted');
    setConfirmDelete(null);
    load();
  };

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-3xl text-white">Products</h1>
          <p className="mt-1 text-sm text-ink-400">{products.length} products in catalog</p>
        </div>
        <button onClick={openCreate} className="btn-gold">
          <Plus size={16} /> Add Product
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or SKU..."
          className="input-luxe pl-10"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-ink-800 bg-black-card">
        <table className="w-full text-sm">
          <thead className="border-b border-ink-800 text-left text-xs uppercase tracking-wide-sm text-ink-500">
            <tr>
              <th className="p-4">Product</th>
              <th className="p-4">Price</th>
              <th className="p-4">Stock</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="p-8 text-center text-ink-500">Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={5} className="p-8 text-center text-ink-500">No products found</td></tr>
            ) : (
              filtered.map((p) => (
                <tr key={p.id} className="border-b border-ink-800/60 last:border-0 hover:bg-black-soft">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                    <div className="h-12 w-10 shrink-0 overflow-hidden">
                      {p.image_url ? (
                        <img src={p.image_url} alt={p.name} className="h-full w-full object-cover" />
                      ) : (
                        <ImagePlaceholder iconSize={14} rounded="rounded-none" showLabel={false} />
                      )}
                    </div>
                      <div>
                        <p className="font-medium text-white">{p.name}</p>
                        <p className="text-xs text-ink-500">{p.sku} · {p.volume_ml}ml</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-white">{formatPrice(p.price)}</td>
                  <td className="p-4">
                    <span className={p.stock <= 10 ? 'text-rose-400' : 'text-ink-200'}>{p.stock}</span>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-wrap gap-1">
                      {p.featured && <span className="badge bg-gold/15 text-gold border border-gold/30">Featured</span>}
                      {p.is_new && <span className="badge border border-emerald-500/30 bg-emerald-500/10 text-emerald-300">New</span>}
                      {p.best_seller && <span className="badge border border-ink-700 text-ink-300">Best</span>}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openEdit(p)} className="grid h-8 w-8 place-items-center border border-ink-700 text-ink-300 hover:border-gold hover:text-gold" aria-label="Edit">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => setConfirmDelete(p)} className="grid h-8 w-8 place-items-center border border-ink-700 text-ink-300 hover:border-rose-500 hover:text-rose-400" aria-label="Delete">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 p-4" onClick={() => setShowForm(false)}>
          <div className="mx-auto my-8 max-w-3xl border border-ink-700 bg-black-deep" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-ink-800 p-5">
              <h2 className="font-serif text-xl text-white">{editing ? 'Edit Product' : 'New Product'}</h2>
              <button onClick={() => setShowForm(false)} className="text-ink-400 hover:text-gold"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="max-h-[70vh] overflow-y-auto p-6">
              {/* Image upload */}
              <div className="mb-5">
                <label className="label-luxe">Product Image</label>
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
                      {uploading ? 'Uploading…' : <><Upload size={14} /> {imageUrl ? 'Replace Image' : 'Upload Image'}</>}
                    </button>
                    {imageUrl && (
                      <button type="button" onClick={removeImage} className="text-xs text-ink-400 hover:text-rose-300">
                        Remove image
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="label-luxe">Name</label>
                  <input {...register('name', { required: true })} className="input-luxe" />
                  {errors.name && <p className="mt-1 text-xs text-rose-400">Required</p>}
                </div>
                <div className="sm:col-span-2">
                  <label className="label-luxe">Description</label>
                  <textarea rows={3} {...register('description', { required: true })} className="input-luxe resize-none" />
                </div>
                <div>
                  <label className="label-luxe">Category</label>
                  <select {...register('category_id')} className="input-luxe">
                    <option value="">None</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label-luxe">Collection</label>
                  <select {...register('collection_id')} className="input-luxe">
                    <option value="">None</option>
                    {collections.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label-luxe">Brand</label>
                  <input {...register('brand')} className="input-luxe" />
                </div>
                <div>
                  <label className="label-luxe">Gender</label>
                  <select {...register('gender')} className="input-luxe">
                    {GENDERS.map((g) => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label-luxe">Default Volume (ml)</label>
                  <input type="number" {...register('volume_ml', { required: true })} className="input-luxe" />
                </div>
                <div>
                  <label className="label-luxe">Product SKU (optional)</label>
                  <input {...register('sku')} className="input-luxe" />
                </div>
                <div className="sm:col-span-2">
                  <label className="label-luxe">Top Notes (comma-separated)</label>
                  <input {...register('top_notes')} className="input-luxe" placeholder="Bergamot, Saffron" />
                </div>
                <div className="sm:col-span-2">
                  <label className="label-luxe">Middle Notes (comma-separated)</label>
                  <input {...register('middle_notes')} className="input-luxe" placeholder="Rose, Oud" />
                </div>
                <div className="sm:col-span-2">
                  <label className="label-luxe">Base Notes (comma-separated)</label>
                  <input {...register('base_notes')} className="input-luxe" placeholder="Sandalwood, Amber" />
                </div>
                <div className="sm:col-span-2">
                  <label className="label-luxe">Ingredients</label>
                  <textarea rows={2} {...register('ingredients')} className="input-luxe resize-none" />
                </div>
                <div>
                  <label className="label-luxe">Bottle Shape</label>
                  <select {...register('bottle_shape')} className="input-luxe">
                    {BOTTLE_SHAPES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label-luxe">Glass Color</label>
                  <div className="flex gap-2">
                    {GLASS_COLORS.map((c) => (
                      <label key={c} className="relative cursor-pointer">
                        <input type="radio" value={c} {...register('bottle_glass')} className="sr-only peer" />
                        <div className="h-8 w-8 border-2 border-ink-700 peer-checked:border-gold" style={{ background: c }} />
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="label-luxe">Cap Color</label>
                  <input type="color" {...register('bottle_cap')} className="h-10 w-full border border-ink-700 bg-transparent" />
                </div>
                <div>
                  <label className="label-luxe">Label Color</label>
                  <input type="color" {...register('bottle_label')} className="h-10 w-full border border-ink-700 bg-transparent" />
                </div>
                <div className="sm:col-span-2 flex flex-wrap gap-5">

<label className="flex items-center gap-2">
  <input
    type="checkbox"
    {...register("featured")}
    className="accent-gold"
  />
  Featured
</label>

<label className="flex items-center gap-2">
  <input
    type="checkbox"
    {...register("best_seller")}
    className="accent-gold"
  />
  Best Seller
</label>

<label className="flex items-center gap-2">
  <input
    type="checkbox"
    {...register("is_new")}
    className="accent-gold"
  />
  New Arrival
</label>

</div>

              {/* Variants section */}
              <div className="mt-8 border-t border-ink-800 pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-serif text-lg text-white">Variants</h3>
                    <p className="mt-0.5 text-xs text-ink-500">Each size has its own price, sale price, and stock. Set one as the default.</p>
                  </div>
                  <button type="button" onClick={addVariant} className="btn-outline flex items-center gap-2 text-xs">
                    <Plus size={14} /> Add Variant
                  </button>
                </div>

                <div className="mt-4 space-y-3">
                  {/* Header row */}
                  <div className="hidden grid-cols-[1fr_70px_90px_90px_70px_36px_30px_80px] gap-2 text-[10px] uppercase tracking-wide-sm text-ink-500 sm:grid">
                    <span>Size Label</span>
                    <span>Vol (ml)</span>
                    <span>Price</span>
                    <span>Sale Price</span>
                    <span>Stock</span>
                    <span>SKU</span>
                    <span>Default</span>
                    <span></span>
                  </div>

                  {variants.map((v, idx) => (
                    <div key={v.id} className="border border-ink-800 bg-black-soft p-3">
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-[1fr_70px_90px_90px_70px_36px_30px_80px] sm:items-center">
                        <input
                          value={v.size_label}
                          onChange={(e) => updateVariant(v.id, 'size_label', e.target.value)}
                          placeholder="e.g. 30ml"
                          className="col-span-2 border border-ink-700 bg-black-deep px-3 py-2 text-sm text-white focus:border-gold focus:outline-none sm:col-span-1"
                        />
                        <input
                          type="number"
                          value={v.volume_ml}
                          onChange={(e) => updateVariant(v.id, 'volume_ml', e.target.value)}
                          className="border border-ink-700 bg-black-deep px-2 py-2 text-sm text-white focus:border-gold focus:outline-none"
                        />
                        <input
                          type="number"
                          step="0.01"
                          value={v.price}
                          onChange={(e) => updateVariant(v.id, 'price', e.target.value)}
                          placeholder="0"
                          className="border border-ink-700 bg-black-deep px-2 py-2 text-sm text-white focus:border-gold focus:outline-none"
                        />
                        <input
                          type="number"
                          step="0.01"
                          value={v.compare_at_price}
                          onChange={(e) => updateVariant(v.id, 'compare_at_price', e.target.value)}
                          placeholder="—"
                          className="border border-ink-700 bg-black-deep px-2 py-2 text-sm text-white focus:border-gold focus:outline-none"
                        />
                        <input
                          type="number"
                          value={v.stock}
                          onChange={(e) => updateVariant(v.id, 'stock', e.target.value)}
                          className="border border-ink-700 bg-black-deep px-2 py-2 text-sm text-white focus:border-gold focus:outline-none"
                        />
                        <input
                          value={v.sku}
                          onChange={(e) => updateVariant(v.id, 'sku', e.target.value)}
                          placeholder="—"
                          className="border border-ink-700 bg-black-deep px-2 py-2 text-sm text-white focus:border-gold focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setDefaultVariant(v.id)}
                          className="grid h-9 w-9 place-items-center justify-self-center"
                          aria-label="Set as default"
                        >
                          <Star size={16} fill={v.is_default ? '#C9A227' : 'none'} stroke={v.is_default ? '#C9A227' : '#666'} />
                        </button>
                        <div className="flex items-center justify-self-end gap-1">
                          <button type="button" onClick={() => moveVariant(idx, -1)} disabled={idx === 0} className="grid h-7 w-7 place-items-center text-ink-400 hover:text-gold disabled:opacity-20" aria-label="Move up">
                            <ArrowUp size={14} />
                          </button>
                          <button type="button" onClick={() => moveVariant(idx, 1)} disabled={idx === variants.length - 1} className="grid h-7 w-7 place-items-center text-ink-400 hover:text-gold disabled:opacity-20" aria-label="Move down">
                            <ArrowDown size={14} />
                          </button>
                          <button type="button" onClick={() => removeVariant(v.id)} disabled={variants.length <= 1} className="grid h-7 w-7 place-items-center text-ink-400 hover:text-rose-400 disabled:opacity-20" aria-label="Remove variant">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                      <div className="mt-2 sm:hidden">
                        <input
                          value={v.weight}
                          onChange={(e) => updateVariant(v.id, 'weight', e.target.value)}
                          placeholder="Weight (optional)"
                          className="w-full border border-ink-700 bg-black-deep px-3 py-2 text-sm text-white focus:border-gold focus:outline-none"
                        />
                      </div>
                      <div className="mt-2 hidden sm:block">
                        <input
                          value={v.weight}
                          onChange={(e) => updateVariant(v.id, 'weight', e.target.value)}
                          placeholder="Weight (optional, e.g. 0.2kg)"
                          className="w-full max-w-xs border border-ink-700 bg-black-deep px-3 py-2 text-sm text-white focus:border-gold focus:outline-none"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button type="submit" disabled={saving} className="btn-gold flex-1">
                  {saving ? 'Saving...' : editing ? 'Update Product' : 'Create Product'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="btn-outline">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-4" onClick={() => setConfirmDelete(null)}>
          <div className="max-w-sm border border-ink-700 bg-black-deep p-6" onClick={(e) => e.stopPropagation()}>
            <AlertCircle className="h-10 w-10 text-rose-400" />
            <h3 className="mt-4 font-serif text-xl text-white">Delete this product?</h3>
            <p className="mt-2 text-sm text-ink-400">"{confirmDelete.name}" will be permanently removed. This cannot be undone.</p>
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
