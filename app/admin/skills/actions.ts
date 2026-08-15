"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createAdminClient,
  getSkillStorageBucket,
  hasAdminDataConfig,
  requireAdmin,
} from "@/lib/supabase/admin";
import type { SkillStatus } from "@/lib/supabase/skill-records";

export type SkillActionState = {
  error: string;
};

export type SkillOrderActionState = {
  error: string;
  success: string;
  savedIds: string[] | null;
};

export type DeleteSkillActionState = {
  error: string;
  success: string;
  deletedId: string | null;
};

type ParsedSkill = {
  slug: string;
  name: string;
  eyebrow: string;
  short_description: string;
  description: string;
  price: number;
  discount_percent_vn: number;
  category: string;
  version: string;
  status: SkillStatus;
  video_url: string | null;
  accent: string;
  accent_soft: string;
  featured: boolean;
  deliverables: string[];
  outcomes: string[];
  requirements: string[];
  name_en: string | null;
  eyebrow_en: string;
  short_description_en: string;
  description_en: string;
  category_en: string;
  price_usd_cents: number | null;
  discount_percent_international: number;
  is_free: boolean;
  lemon_checkout_url: string | null;
  deliverables_en: string[];
  outcomes_en: string[];
  requirements_en: string[];
};

const statuses = new Set<SkillStatus>(["draft", "published", "archived"]);
const allowedFileExtensions = new Set(["skill", "zip", "md", "txt", "json"]);
const maxFileSize = 4 * 1024 * 1024;

function getText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function getList(formData: FormData, key: string) {
  return getText(formData, key)
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseSkill(formData: FormData):
  | { data: ParsedSkill; error: "" }
  | { data: null; error: string } {
  const name = getText(formData, "name");
  const slug = getText(formData, "slug").toLowerCase();
  const category = getText(formData, "category");
  const version = getText(formData, "version");
  const eyebrow = getText(formData, "eyebrow");
  const shortDescription = getText(formData, "short_description");
  const description = getText(formData, "description");
  const priceText = getText(formData, "price").replace(/[^0-9]/g, "");
  const vietnamSaleType = getText(formData, "sale_type_vn");
  const parsedVndPrice = priceText === "" ? null : Number(priceText);
  const price = vietnamSaleType === "free" ? 0 : parsedVndPrice;
  const discountVnText = getText(formData, "discount_percent_vn");
  const parsedDiscountVn = discountVnText === "" ? 0 : Number(discountVnText);
  const discountPercentVn = vietnamSaleType === "free" ? 0 : parsedDiscountVn;
  const statusValue = getText(formData, "status") as SkillStatus;
  const videoValue = getText(formData, "video_url");
  const accent = getText(formData, "accent") || "#b8ff6a";
  const accentSoft = getText(formData, "accent_soft") || "#19351e";
  const nameEn = getText(formData, "name_en");
  const eyebrowEn = getText(formData, "eyebrow_en");
  const shortDescriptionEn = getText(formData, "short_description_en");
  const descriptionEn = getText(formData, "description_en");
  const categoryEn = getText(formData, "category_en");
  const usdPriceText = getText(formData, "price_usd");
  const internationalSaleType = getText(formData, "sale_type_international");
  const isFree = internationalSaleType === "free";
  const usdPrice = usdPriceText === "" ? null : Number(usdPriceText);
  const priceUsdCents = isFree ? 0 : usdPrice === null ? null : Math.round(usdPrice * 100);
  const discountInternationalText = getText(formData, "discount_percent_international");
  const parsedDiscountInternational = discountInternationalText === ""
    ? 0
    : Number(discountInternationalText);
  const discountPercentInternational = isFree ? 0 : parsedDiscountInternational;

  if (usdPriceText && (!Number.isFinite(usdPrice) || usdPrice! < 0 || usdPrice! > 1000000)) {
    return { data: null, error: "The USD price must be between 0 and 1,000,000." };
  }

  if (!name || name.length > 120) {
    return { data: null, error: "The Skill name is required and limited to 120 characters." };
  }

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return {
      data: null,
      error: "The slug may only contain lowercase letters, numbers and hyphens.",
    };
  }

  if (!category || !version || !shortDescription || !description) {
    return {
      data: null,
      error: "Enter the category, version and required Skill descriptions.",
    };
  }

  if (vietnamSaleType !== "free" && vietnamSaleType !== "paid") {
    return { data: null, error: "Choose Free or Paid for the Vietnamese store." };
  }

  if (price === null || !Number.isSafeInteger(price) || price < 0) {
    return { data: null, error: "The VND price must be a non-negative integer." };
  }

  if (vietnamSaleType === "paid" && price <= 0) {
    return { data: null, error: "Enter a VND price greater than 0 for a paid Vietnamese Skill." };
  }

  if (!Number.isInteger(discountPercentVn) || discountPercentVn < 0 || discountPercentVn > 99) {
    return { data: null, error: "The Vietnam discount must be a whole percentage from 0 to 99." };
  }

  if (!statuses.has(statusValue)) {
    return { data: null, error: "The selected Skill status is invalid." };
  }

  if (!/^#[0-9a-fA-F]{6}$/.test(accent) || !/^#[0-9a-fA-F]{6}$/.test(accentSoft)) {
    return { data: null, error: "Interface colors must use HEX format, for example #b8ff6a." };
  }

  if (nameEn && (!categoryEn || !shortDescriptionEn || !descriptionEn)) {
    return {
      data: null,
      error: "An English name requires an English category, card description and full description.",
    };
  }

  if (internationalSaleType !== "free" && internationalSaleType !== "paid") {
    return { data: null, error: "Choose Free Skill or Paid Skill for the international store." };
  }

  if (nameEn && !isFree && (priceUsdCents === null || !Number.isSafeInteger(priceUsdCents) || priceUsdCents <= 0)) {
    return { data: null, error: "Enter a USD price greater than $0 for this paid international Skill." };
  }

  if (
    !Number.isInteger(discountPercentInternational) ||
    discountPercentInternational < 0 ||
    discountPercentInternational > 99
  ) {
    return { data: null, error: "The international discount must be a whole percentage from 0 to 99." };
  }

  let videoUrl: string | null = null;
  if (videoValue) {
    try {
      const parsedUrl = new URL(videoValue);
      if (parsedUrl.protocol !== "https:") throw new Error("invalid protocol");
      videoUrl = parsedUrl.toString();
    } catch {
      return { data: null, error: "The video URL must be a valid HTTPS address." };
    }
  }

  if (statusValue === "published" && !videoUrl) {
    return {
      data: null,
      error: "Add a result video URL before publishing this Skill.",
    };
  }

  return {
    data: {
      slug,
      name,
      eyebrow,
      short_description: shortDescription,
      description,
      price,
      discount_percent_vn: discountPercentVn,
      category,
      version,
      status: statusValue,
      video_url: videoUrl,
      accent,
      accent_soft: accentSoft,
      featured: formData.get("featured") === "on",
      deliverables: getList(formData, "deliverables"),
      outcomes: getList(formData, "outcomes"),
      requirements: getList(formData, "requirements"),
      name_en: nameEn || null,
      eyebrow_en: eyebrowEn,
      short_description_en: shortDescriptionEn,
      description_en: descriptionEn,
      category_en: categoryEn,
      price_usd_cents: priceUsdCents,
      discount_percent_international: discountPercentInternational,
      is_free: isFree,
      // Legacy database column retained for backwards compatibility; PayPal creates orders dynamically.
      lemon_checkout_url: null,
      deliverables_en: getList(formData, "deliverables_en"),
      outcomes_en: getList(formData, "outcomes_en"),
      requirements_en: getList(formData, "requirements_en"),
    },
    error: "",
  };
}

function getUpload(formData: FormData) {
  const value = formData.get("skill_file");
  if (!(value instanceof File) || value.size === 0) return null;
  return value;
}

function validateUpload(file: File | null) {
  if (!file) return "";
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";

  if (!allowedFileExtensions.has(extension)) {
    return "Skill files must use .skill, .zip, .md, .txt or .json format.";
  }

  if (file.size > maxFileSize) {
    return "The Skill file must not exceed 4 MB.";
  }

  return "";
}

function safeFileName(fileName: string) {
  return fileName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase();
}

async function uploadSkillFile(slug: string, file: File) {
  const supabase = createAdminClient();
  const bucket = getSkillStorageBucket();
  const path = `${slug}/${crypto.randomUUID()}-${safeFileName(file.name)}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: "3600",
    contentType: file.type || "application/octet-stream",
    upsert: false,
  });

  return { path, error };
}

function dataErrorMessage(message: string, code?: string) {
  if (
    message.toLowerCase().includes("discount_percent_vn") ||
    message.toLowerCase().includes("discount_percent_international")
  ) {
    return "Discounts are not enabled in Supabase yet. Run migration 202608150001_skill_discounts.sql, then save again.";
  }
  if (code === "23505" || message.toLowerCase().includes("duplicate")) {
    return "This slug is already used by another Skill.";
  }
  return `Unable to save the Skill: ${message}`;
}

function isMissingSortOrderError(error: { code?: string; message: string } | null) {
  if (!error) return false;
  return (
    error.code === "42703" ||
    error.code === "PGRST202" ||
    error.code === "PGRST204" ||
    error.message.toLowerCase().includes("sort_order") ||
    error.message.toLowerCase().includes("reorder_skills")
  );
}

async function getNextSortOrder() {
  const { data, error } = await createAdminClient()
    .from("skills")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle<{ sort_order: number }>();

  if (isMissingSortOrderError(error)) return { sortOrder: null, error: null };
  if (error) return { sortOrder: null, error };
  return { sortOrder: (data?.sort_order ?? -1) + 1, error: null };
}

export async function createSkill(
  _previousState: SkillActionState,
  formData: FormData,
): Promise<SkillActionState> {
  await requireAdmin();

  if (!hasAdminDataConfig()) {
    return { error: "SUPABASE_SECRET_KEY or SKILL_STORAGE_BUCKET is missing on Vercel." };
  }

  const parsed = parseSkill(formData);
  if (!parsed.data) return { error: parsed.error };

  const upload = getUpload(formData);
  const uploadError = validateUpload(upload);
  if (uploadError) return { error: uploadError };

  if (parsed.data.status === "published" && !upload) {
    return { error: "Upload the Skill file before publishing it." };
  }

  let filePath: string | null = null;
  if (upload) {
    const result = await uploadSkillFile(parsed.data.slug, upload);
    if (result.error) return { error: `Unable to upload the file: ${result.error.message}` };
    filePath = result.path;
  }

  const supabase = createAdminClient();
  const nextOrder = await getNextSortOrder();
  if (nextOrder.error) {
    if (filePath) await supabase.storage.from(getSkillStorageBucket()).remove([filePath]);
    return { error: `Unable to determine the Skill position: ${nextOrder.error.message}` };
  }

  const insertData: ParsedSkill & { file_path: string | null; sort_order?: number } = {
    ...parsed.data,
    file_path: filePath,
  };
  if (nextOrder.sortOrder !== null) insertData.sort_order = nextOrder.sortOrder;

  const { data, error } = await supabase
    .from("skills")
    .insert(insertData)
    .select("id")
    .single<{ id: string }>();

  if (error || !data) {
    if (filePath) await supabase.storage.from(getSkillStorageBucket()).remove([filePath]);
    return { error: dataErrorMessage(error?.message ?? "Unknown error", error?.code) };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/skills");
  revalidatePath("/");
  revalidatePath("/skills");
  revalidatePath(`/skills/${parsed.data.slug}`);
  revalidatePath(`/checkout/${parsed.data.slug}`);
  redirect(`/admin/skills/${data.id}?created=1`);
}

export async function updateSkill(
  _previousState: SkillActionState,
  formData: FormData,
): Promise<SkillActionState> {
  await requireAdmin();

  if (!hasAdminDataConfig()) {
    return { error: "SUPABASE_SECRET_KEY or SKILL_STORAGE_BUCKET is missing on Vercel." };
  }

  const id = getText(formData, "id");
  if (!/^[0-9a-f-]{36}$/i.test(id)) return { error: "The Skill ID is invalid." };

  const parsed = parseSkill(formData);
  if (!parsed.data) return { error: parsed.error };

  const upload = getUpload(formData);
  const uploadError = validateUpload(upload);
  if (uploadError) return { error: uploadError };

  const supabase = createAdminClient();
  const { data: current, error: currentError } = await supabase
    .from("skills")
    .select("file_path, slug")
    .eq("id", id)
    .maybeSingle<{ file_path: string | null; slug: string }>();

  if (currentError || !current) return { error: "The Skill to update could not be found." };

  if (parsed.data.status === "published" && !upload && !current.file_path) {
    return { error: "Upload the Skill file before publishing it." };
  }

  let nextFilePath = current.file_path;
  if (upload) {
    const result = await uploadSkillFile(parsed.data.slug, upload);
    if (result.error) return { error: `Unable to upload the file: ${result.error.message}` };
    nextFilePath = result.path;
  }

  const { error } = await supabase
    .from("skills")
    .update({ ...parsed.data, file_path: nextFilePath })
    .eq("id", id);

  if (error) {
    if (upload && nextFilePath) {
      await supabase.storage.from(getSkillStorageBucket()).remove([nextFilePath]);
    }
    return { error: dataErrorMessage(error.message, error.code) };
  }

  if (upload && current.file_path && current.file_path !== nextFilePath) {
    await supabase.storage.from(getSkillStorageBucket()).remove([current.file_path]);
  }

  revalidatePath("/admin");
  revalidatePath("/admin/skills");
  revalidatePath(`/admin/skills/${id}`);
  revalidatePath("/");
  revalidatePath("/skills");
  revalidatePath(`/skills/${current.slug}`);
  revalidatePath(`/skills/${parsed.data.slug}`);
  revalidatePath(`/checkout/${current.slug}`);
  revalidatePath(`/checkout/${parsed.data.slug}`);
  redirect(`/admin/skills/${id}?saved=1`);
}

export async function reorderSkills(
  _previousState: SkillOrderActionState,
  formData: FormData,
): Promise<SkillOrderActionState> {
  await requireAdmin();

  if (!hasAdminDataConfig()) {
    return {
      error: "Supabase is not configured on Vercel.",
      success: "",
      savedIds: null,
    };
  }

  let ids: string[];
  try {
    const parsed = JSON.parse(getText(formData, "skill_ids"));
    ids = Array.isArray(parsed) ? parsed : [];
  } catch {
    ids = [];
  }

  const validIds =
    ids.length > 0 &&
    ids.length <= 500 &&
    ids.every((id) => typeof id === "string" && /^[0-9a-f-]{36}$/i.test(id)) &&
    new Set(ids).size === ids.length;

  if (!validIds) {
    return {
      error: "The Skill order is invalid. Reload the page and try again.",
      success: "",
      savedIds: null,
    };
  }

  const { error } = await createAdminClient().rpc("reorder_skills", {
    skill_ids: ids,
  });

  if (error) {
    return {
      error: isMissingSortOrderError(error)
        ? "Skill ordering is not enabled in Supabase. Run migration 202608060002_skill_sort_order.sql."
        : `Unable to save the Skill order: ${error.message}`,
      success: "",
      savedIds: null,
    };
  }

  revalidatePath("/admin/skills");
  revalidatePath("/");
  revalidatePath("/skills");

  return {
    error: "",
    success: "The new order was saved and applied to the storefront.",
    savedIds: ids,
  };
}

export async function deleteSkill(formData: FormData): Promise<DeleteSkillActionState> {
  await requireAdmin();

  if (!hasAdminDataConfig()) {
    return { error: "Supabase is not configured on Vercel.", success: "", deletedId: null };
  }

  const id = getText(formData, "id");
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return { error: "The Skill ID is invalid.", success: "", deletedId: null };
  }

  const supabase = createAdminClient();
  const { data: skill, error: skillError } = await supabase
    .from("skills")
    .select("id, slug, name, file_path")
    .eq("id", id)
    .maybeSingle<{ id: string; slug: string; name: string; file_path: string | null }>();

  if (skillError || !skill) {
    return { error: "The Skill to delete could not be found.", success: "", deletedId: null };
  }

  const { count, error: itemError } = await supabase
    .from("order_items")
    .select("id", { count: "exact", head: true })
    .eq("skill_id", id);

  if (itemError) {
    return {
      error: `Unable to check the Skill's order history: ${itemError.message}`,
      success: "",
      deletedId: null,
    };
  }

  const { error: deleteError } = await supabase.from("skills").delete().eq("id", id);
  if (deleteError) {
    return {
      error: `Unable to delete the Skill: ${deleteError.message}`,
      success: "",
      deletedId: null,
    };
  }

  let success = `Deleted “${skill.name}”.`;
  if ((count ?? 0) > 0) {
    success += " Its delivery file was kept so previous customers can still download their purchase.";
  } else if (skill.file_path) {
    const { error: storageError } = await supabase.storage
      .from(getSkillStorageBucket())
      .remove([skill.file_path]);
    if (storageError) {
      success += " The product was deleted, but its unused file could not be removed from Storage.";
    }
  }

  revalidatePath("/admin");
  revalidatePath("/admin/skills");
  revalidatePath("/");
  revalidatePath("/skills");
  revalidatePath(`/skills/${skill.slug}`);
  revalidatePath(`/checkout/${skill.slug}`);

  return { error: "", success, deletedId: id };
}
