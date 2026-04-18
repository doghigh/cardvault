import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { API } from "../App";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { toast } from "sonner";
import {
  CreditCard,
  Plus,
  Search,
  TrendingUp,
  Package,
  DollarSign,
  Grid,
  List,
} from "lucide-react";

export default function Dashboard() {
  const [cards, setCards] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("grid");

  useEffect(() => {
    fetchCards();
    fetchStats();
  }, []);

  const fetchCards = async () => {
    try {
      const response = await axios.get(`${API}/cards`);
      setCards(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Error fetching cards:", error);
      toast.error("Failed to load cards");
      setCards([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API}/stats`);
      setStats(response.data);
    } catch (error) {
      console.error("Error fetching stats:", error);
      setStats({
        total_cards: 0,
        total_value: 0,
        cards_with_price: 0,
      });
    }
  };

  const filteredCards = cards.filter((card) => {
    const name = card.card_name || "";
    const type = card.card_type || "";
    const query = searchQuery.toLowerCase();

    return (
      name.toLowerCase().includes(query) ||
      type.toLowerCase().includes(query)
    );
  });

  const getConditionBadge = (notes, condition) => {
    const normalizedCondition = (condition || "").toLowerCase();
    const normalizedNotes = (notes || "").toLowerCase();

    if (
      normalizedCondition.includes("mint") ||
      normalizedNotes.includes("mint") ||
      normalizedNotes.includes("no damage")
    ) {
      return <Badge className="badge-mint text-xs">Mint</Badge>;
    }

    if (
      normalizedCondition.includes("near") ||
      normalizedNotes.includes("minor") ||
      normalizedNotes.includes("light")
    ) {
      return <Badge className="badge-near-mint text-xs">Near Mint</Badge>;
    }

    if (!normalizedCondition && !normalizedNotes) {
      return <Badge className="text-xs bg-zinc-700 text-zinc-200">Unknown</Badge>;
    }

    return <Badge className="badge-damaged text-xs">Damaged</Badge>;
  };

  return (
    <div className="min-h-screen bg-zinc-950">
      <header className="glass sticky top-0 z-50 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-zinc-950" strokeWidth={1.5} />
            </div>
            <span className="text-xl font-bold text-zinc-50 tracking-tight">
              CardVault
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <Link to="/scanner">
              <Button
                data-testid="scan-card-btn"
                className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Card
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <StatCard
              icon={<Package className="w-5 h-5" />}
              label="Total Cards"
              value={stats.total_cards ?? 0}
            />
            <StatCard
              icon={<DollarSign className="w-5 h-5" />}
              label="Collection Value"
              value={`$${Number(stats.total_value ?? 0).toLocaleString()}`}
            />
            <StatCard
              icon={<TrendingUp className="w-5 h-5" />}
              label="Priced Cards"
              value={stats.cards_with_price ?? 0}
            />
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <Input
              placeholder="Search cards..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-testid="search-input"
              className="pl-10 bg-zinc-900 border-white/10 text-zinc-50 placeholder:text-zinc-500"
            />
          </div>

          <div className="flex gap-2">
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size="icon"
              onClick={() => setViewMode("grid")}
              data-testid="grid-view-btn"
              className={
                viewMode === "grid"
                  ? "bg-amber-500 text-zinc-950"
                  : "border-white/20 text-zinc-300"
              }
            >
              <Grid className="w-4 h-4" />
            </Button>

            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="icon"
              onClick={() => setViewMode("list")}
              data-testid="list-view-btn"
              className={
                viewMode === "list"
                  ? "bg-amber-500 text-zinc-950"
                  : "border-white/20 text-zinc-300"
              }
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-12 h-12 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredCards.length === 0 ? (
          <EmptyState />
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6" data-testid="cards-grid">
            {filteredCards.map((card) => (
              <CardItem
                key={card.card_id || card.id}
                card={card}
                getConditionBadge={getConditionBadge}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-4" data-testid="cards-list">
            {filteredCards.map((card) => (
              <CardListItem
                key={card.card_id || card.id}
                card={card}
                getConditionBadge={getConditionBadge}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function StatCard({ icon, label, value }) {
  return (
    <div className="bg-zinc-900 border border-white/10 rounded-lg p-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
          {icon}
        </div>
        <div>
          <p className="text-xs tracking-[0.1em] uppercase text-zinc-400">{label}</p>
          <p className="text-xl font-bold text-zinc-50 font-mono">{value}</p>
        </div>
      </div>
    </div>
  );
}

function CardItem({ card, getConditionBadge }) {
  const cardId = card.card_id || card.id;

  return (
    <Link
      to={`/card/${cardId}`}
      className="bg-zinc-900 border border-white/10 rounded-lg overflow-hidden card-hover block"
      data-testid={`card-${cardId}`}
    >
      <div className="aspect-[3/4] bg-zinc-800 relative">
        {card.image_front_base64 ? (
          <img
            src={`data:image/jpeg;base64,${card.image_front_base64}`}
            alt={card.card_name || "Card image"}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <CreditCard className="w-12 h-12 text-zinc-600" />
          </div>
        )}
        <div className="absolute top-2 right-2">
          {getConditionBadge(card.notes || card.damage_notes, card.condition)}
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-medium text-zinc-50 truncate mb-1">
          {card.card_name || "Untitled card"}
        </h3>
        <p className="text-sm text-zinc-400 mb-2">
          {card.card_type || "Uncategorized"}
        </p>
        {card.avg_price != null && (
          <p className="text-lg font-bold font-mono text-amber-500">
            ${Number(card.avg_price).toFixed(2)}
          </p>
        )}
      </div>
    </Link>
  );
}

function CardListItem({ card, getConditionBadge }) {
  const cardId = card.card_id || card.id;

  return (
    <Link
      to={`/card/${cardId}`}
      className="bg-zinc-900 border border-white/10 rounded-lg p-4 card-hover flex items-center gap-4"
      data-testid={`card-list-${cardId}`}
    >
      <div className="w-16 h-20 bg-zinc-800 rounded overflow-hidden flex-shrink-0">
        {card.image_front_base64 ? (
          <img
            src={`data:image/jpeg;base64,${card.image_front_base64}`}
            alt={card.card_name || "Card image"}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <CreditCard className="w-6 h-6 text-zinc-600" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-zinc-50 truncate">
          {card.card_name || "Untitled card"}
        </h3>
        <p className="text-sm text-zinc-400">
          {card.card_type || "Uncategorized"}
          {card.card_year ? ` • ${card.card_year}` : ""}
        </p>
      </div>

      <div className="flex items-center gap-4">
        {getConditionBadge(card.notes || card.damage_notes, card.condition)}
        {card.avg_price != null && (
          <p className="text-lg font-bold font-mono text-amber-500">
            ${Number(card.avg_price).toFixed(2)}
          </p>
        )}
      </div>
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-24">
      <div className="max-w-md mx-auto">
        <img
          src="https://images.pexels.com/photos/9343494/pexels-photo-9343494.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"
          alt="Start your collection"
          className="w-full h-48 object-cover rounded-lg mb-6 opacity-75"
        />
        <h3 className="text-xl font-medium text-zinc-50 mb-2">Start Your Collection</h3>
        <p className="text-zinc-400 mb-6">
          Add your first trading card to begin cataloging your collection.
        </p>
        <Link to="/scanner">
          <Button
            data-testid="empty-scan-btn"
            className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Your First Card
          </Button>
        </Link>
      </div>
    </div>
  );
}