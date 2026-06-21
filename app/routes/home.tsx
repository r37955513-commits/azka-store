import { Link, useLoaderData } from "react-router";
import { ShoppingCart, Zap } from "lucide-react";
import { sql, type Category, type Product } from "~/lib/db.server";
import { Navbar } from "~/components/Navbar";
import { CategoryIcon } from "~/components/icons";

export function meta() {
  return [
    { title: "أذكى متجر — الخدمات الرقمية" },
    { name: "description", content: "شحن الألعاب، بطاقات الهدايا، واشتراكات السوشال ميديا" },
  ];
}

export async function loader() {
  const categories = (await sql`
    SELECT * FROM categories ORDER BY sort_order, id
  `) as Category[];

  const products = (await sql`
    SELECT * FROM products WHERE is_active = TRUE ORDER BY category_id, id
  `) as Product[];

  return { categories, products };
}

export default function Home() {
  const { categories, products } = useLoaderData<typeof loader>();

  return (
    <div className="min-h-screen">
      <Navbar />

      <section className="bg-gradient-to-l from-brand-700 to-brand-500 text-white">
        <div className="mx-auto max-w-6xl px-4 py-12 text-center">
          <span className="badge mx-auto mb-4 bg-white/15 text-white">
            <Zap className="h-3.5 w-3.5" /> تسليم فوري وآمن
          </span>
          <h1 className="text-3xl font-extrabold sm:text-4xl">
            كل خدماتك الرقمية في مكان واحد
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-brand-50">
            شحن الألعاب، بطاقات الهدايا، واشتراكات السوشال ميديا — ادفع من محفظتك بسهولة.
          </p>
          <Link to="/wallet" className="btn bg-white text-brand-700 mt-6 hover:bg-brand-50">
            اشحن محفظتك الآن
          </Link>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-4 py-10">
        {categories.map((cat) => {
          const items = products.filter((p) => p.category_id === cat.id);
          if (items.length === 0) return null;
          return (
            <section key={cat.id} id={cat.slug} className="mb-12 animate-fade-in">
              <div className="mb-4 flex items-center gap-2">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-50 text-brand-600">
                  <CategoryIcon name={cat.icon} className="h-5 w-5" />
                </span>
                <h2 className="text-xl font-extrabold text-slate-800">{cat.name}</h2>
              </div>

              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {items.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </section>
          );
        })}
      </main>

      <footer className="border-t border-slate-100 py-6 text-center text-sm text-slate-400">
        © {new Date().getFullYear()} أذكى متجر — جميع الحقوق محفوظة
      </footer>
    </div>
  );
}

function ProductCard({ product }: { product: Product }) {
  return (
    <div className="card group overflow-hidden p-4 transition hover:shadow-md">
      <div className="mb-3 grid h-28 place-items-center rounded-xl bg-gradient-to-br from-slate-50 to-brand-50 text-brand-300">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="h-full w-full rounded-xl object-cover"
          />
        ) : (
          <ShoppingCart className="h-10 w-10" />
        )}
      </div>
      <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-bold text-slate-800">
        {product.name}
      </h3>
      {product.description && (
        <p className="mt-1 line-clamp-1 text-xs text-slate-400">{product.description}</p>
      )}
      <div className="mt-3 flex items-center justify-between">
        <span className="text-lg font-extrabold text-brand-700">{product.price}$</span>
        <Link to={`/checkout/${product.id}`} className="btn-primary px-3 py-1.5 text-sm">
          شراء
        </Link>
      </div>
    </div>
  );
}
