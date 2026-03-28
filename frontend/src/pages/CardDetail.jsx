import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { API } from "../App";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Badge } from "../components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { toast } from "sonner";
import {
  CreditCard,
  ArrowLeft,
  Pencil,
  Trash2,
  DollarSign,
  TrendingUp,
  Search,
  Loader2,
  Save,
  X,
} from "lucide-react";

const CARD_TYPES = [
  "Sports - Baseball",
  "Sports - Basketball",
  "Sports - Football",
  "Sports - Hockey",
  "Pokemon",
  "Yu-Gi-Oh",
  "Magic: The Gathering",
  "Other TCG",
  "Other",
];

export default function CardDetail() {
  const { cardId } = useParams();
  const navigate = useNavigate();
  const [card, setCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [saving, setSaving] = useState(false);
  const [lookingUpPrice, setLookingUpPrice] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showPriceDialog, setShowPriceDialog] = useState(false);
  const [manualPrice, setManualPrice] = useState({
    avg_price: "",
    top_price: "",
    bottom_price: "",
  });

  useEffect(() => {
    fetchCard();
  }, [cardId]);

  const fetchCard = async () => {
    try {
      const response = await axios.get(`${API}/cards/${cardId}`);
      setCard(response.data);
      setEditData(response.data);
    } catch (error) {
      console.error("Error fetching card:", error);
      toast.error("Card not found");
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEdit = async () => {
    setSaving(true);
    try {
      const response = await axios.put(`${API}/cards/${cardId}`, {
        card_name: editData.card_name,
        card_type: editData.card_type,
        card_year: editData.card_year || null,
        damage_notes: editData.damage_notes || null,
      });
      setCard(response.data);
      setEditing(false);
      toast.success("Card updated successfully");
    } catch (error) {
      console.error("Error updating card:", error);
      toast.error("Failed to update card");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${API}/cards/${cardId}`);
      toast.success("Card deleted");
      navigate("/dashboard");
    } catch (error) {
      console.error("Error deleting card:", error);
      toast.error("Failed to delete card");
    }
  };

  const handlePriceLookup = async () => {
    setLookingUpPrice(true);
    try {
      const response = await axios.post(`${API}/cards/${cardId}/lookup-price`);
      if (response.data.success) {
        setCard((prev) => ({
          ...prev,
          avg_price: response.data.avg_price,
          top_price: response.data.top_price,
          bottom_price: response.data.bottom_price,
          price_source: response.data.source,
        }));
        toast.success("Prices updated from eBay");
      } else {
        toast.error(response.data.error || "No prices found");
      }
    } catch (error) {
      console.error("Price lookup error:", error);
      toast.error("Failed to lookup prices");
    } finally {
      setLookingUpPrice(false);
    }
  };

  const handleManualPrice = async () => {
    if (!manualPrice.avg_price || !manualPrice.top_price || !manualPrice.bottom_price) {
      toast.error("Please fill in all price fields");
      return;
    }

    try {
      const response = await axios.put(`${API}/cards/${cardId}/manual-price`, {
        avg_price: parseFloat(manualPrice.avg_price),
        top_price: parseFloat(manualPrice.top_price),
        bottom_price: parseFloat(manualPrice.bottom_price),
        price_source: "Manual Entry",
      });
      setCard(response.data);
      setShowPriceDialog(false);
      setManualPrice({ avg_price: "", top_price: "", bottom_price: "" });
      toast.success("Prices updated");
    } catch (error) {
      console.error("Manual price error:", error);
      toast.error("Failed to update prices");
    }
  };

  const getConditionBadge = (damageNotes) => {
    if (
      !damageNotes ||
      damageNotes.toLowerCase().includes("no damage") ||
      damageNotes.toLowerCase().includes("mint")
    ) {
      return <Badge className="badge-mint">Mint</Badge>;
    } else if (
      damageNotes.toLowerCase().includes("minor") ||
      damageNotes.toLowerCase().includes("light")
    ) {
      return <Badge className="badge-near-mint">Near Mint</Badge>;
    }
    return <Badge className="badge-damaged">Damaged</Badge>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-12 h-12 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!card) return null;

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Navigation */}
      <header className="glass sticky top-0 z-50 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-zinc-950" strokeWidth={1.5} />
            </div>
            <span className="text-xl font-bold text-zinc-50 tracking-tight">CardVault</span>
          </Link>

          <Link to="/dashboard">
            <Button variant="ghost" data-testid="back-btn" className="text-zinc-300 hover:text-zinc-50">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Card Image */}
          <div className="bg-zinc-900 border border-white/10 rounded-lg overflow-hidden">
            <div className="aspect-[3/4] bg-zinc-800">
              {card.image_base64 ? (
                <img
                  src={`data:image/jpeg;base64,${card.image_base64}`}
                  alt={card.card_name}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <CreditCard className="w-24 h-24 text-zinc-600" />
                </div>
              )}
            </div>
          </div>

          {/* Right: Card Details */}
          <div className="space-y-6">
            {/* Header with Edit/Delete */}
            <div className="flex items-start justify-between">
              <div>
                {editing ? (
                  <Input
                    value={editData.card_name}
                    onChange={(e) => setEditData({ ...editData, card_name: e.target.value })}
                    data-testid="edit-card-name"
                    className="text-2xl font-bold bg-zinc-900 border-white/10 text-zinc-50 mb-2"
                  />
                ) : (
                  <h1 className="text-2xl sm:text-3xl font-bold text-zinc-50 mb-2">{card.card_name}</h1>
                )}
                <div className="flex items-center gap-3">
                  {getConditionBadge(card.damage_notes)}
                  <span className="text-zinc-400">{card.card_type}</span>
                  {card.card_year && <span className="text-zinc-400">• {card.card_year}</span>}
                </div>
              </div>
              <div className="flex gap-2">
                {editing ? (
                  <>
                    <Button
                      size="icon"
                      onClick={handleSaveEdit}
                      disabled={saving}
                      data-testid="save-edit-btn"
                      className="bg-amber-500 hover:bg-amber-400 text-zinc-950"
                    >
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => {
                        setEditing(false);
                        setEditData(card);
                      }}
                      data-testid="cancel-edit-btn"
                      className="border-white/20 text-zinc-300"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => setEditing(true)}
                      data-testid="edit-btn"
                      className="border-white/20 text-zinc-300 hover:bg-zinc-800"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                      <DialogTrigger asChild>
                        <Button
                          size="icon"
                          variant="outline"
                          data-testid="delete-btn"
                          className="border-rose-500/50 text-rose-400 hover:bg-rose-500/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-zinc-900 border-white/10">
                        <DialogHeader>
                          <DialogTitle className="text-zinc-50">Delete Card</DialogTitle>
                          <DialogDescription className="text-zinc-400">
                            Are you sure you want to delete this card? This action cannot be undone.
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                          <Button
                            variant="outline"
                            onClick={() => setShowDeleteDialog(false)}
                            className="border-white/20 text-zinc-300"
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={handleDelete}
                            data-testid="confirm-delete-btn"
                            className="bg-rose-500 hover:bg-rose-400 text-white"
                          >
                            Delete
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </>
                )}
              </div>
            </div>

            {/* Edit Form */}
            {editing && (
              <div className="bg-zinc-900 border border-white/10 rounded-lg p-4 space-y-4">
                <div>
                  <Label className="text-zinc-300">Card Type</Label>
                  <Select
                    value={editData.card_type}
                    onValueChange={(value) => setEditData({ ...editData, card_type: value })}
                  >
                    <SelectTrigger
                      data-testid="edit-card-type"
                      className="mt-1 bg-zinc-950 border-white/10 text-zinc-50"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-white/10">
                      {CARD_TYPES.map((type) => (
                        <SelectItem
                          key={type}
                          value={type}
                          className="text-zinc-50 hover:bg-zinc-800 focus:bg-zinc-800"
                        >
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-zinc-300">Year</Label>
                  <Input
                    value={editData.card_year || ""}
                    onChange={(e) => setEditData({ ...editData, card_year: e.target.value })}
                    data-testid="edit-card-year"
                    className="mt-1 bg-zinc-950 border-white/10 text-zinc-50"
                  />
                </div>
                <div>
                  <Label className="text-zinc-300">Condition Notes</Label>
                  <Textarea
                    value={editData.damage_notes || ""}
                    onChange={(e) => setEditData({ ...editData, damage_notes: e.target.value })}
                    data-testid="edit-damage-notes"
                    rows={3}
                    className="mt-1 bg-zinc-950 border-white/10 text-zinc-50 resize-none"
                  />
                </div>
              </div>
            )}

            {/* Price Section */}
            <div className="bg-zinc-900 border border-white/10 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-zinc-50 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-amber-500" />
                  Price Information
                </h2>
                {card.price_source && (
                  <span className="text-xs text-zinc-500">Source: {card.price_source}</span>
                )}
              </div>

              {card.avg_price ? (
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <PriceCard label="Average" value={card.avg_price} />
                  <PriceCard label="High" value={card.top_price} highlight />
                  <PriceCard label="Low" value={card.bottom_price} />
                </div>
              ) : (
                <p className="text-zinc-400 text-sm mb-6">No price data available</p>
              )}

              <div className="flex gap-3">
                <Button
                  onClick={handlePriceLookup}
                  disabled={lookingUpPrice}
                  data-testid="lookup-price-btn"
                  className="flex-1 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold"
                >
                  {lookingUpPrice ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4 mr-2" />
                  )}
                  Lookup eBay Prices
                </Button>

                <Dialog open={showPriceDialog} onOpenChange={setShowPriceDialog}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      data-testid="manual-price-btn"
                      className="border-white/20 text-zinc-300 hover:bg-zinc-800"
                    >
                      <DollarSign className="w-4 h-4 mr-2" />
                      Manual Entry
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-zinc-900 border-white/10">
                    <DialogHeader>
                      <DialogTitle className="text-zinc-50">Enter Prices Manually</DialogTitle>
                      <DialogDescription className="text-zinc-400">
                        Enter the average, high, and low sale prices for this card.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div>
                        <Label className="text-zinc-300">Average Price ($)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={manualPrice.avg_price}
                          onChange={(e) => setManualPrice({ ...manualPrice, avg_price: e.target.value })}
                          data-testid="manual-avg-price"
                          className="mt-1 bg-zinc-950 border-white/10 text-zinc-50"
                        />
                      </div>
                      <div>
                        <Label className="text-zinc-300">High Price ($)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={manualPrice.top_price}
                          onChange={(e) => setManualPrice({ ...manualPrice, top_price: e.target.value })}
                          data-testid="manual-top-price"
                          className="mt-1 bg-zinc-950 border-white/10 text-zinc-50"
                        />
                      </div>
                      <div>
                        <Label className="text-zinc-300">Low Price ($)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={manualPrice.bottom_price}
                          onChange={(e) => setManualPrice({ ...manualPrice, bottom_price: e.target.value })}
                          data-testid="manual-bottom-price"
                          className="mt-1 bg-zinc-950 border-white/10 text-zinc-50"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setShowPriceDialog(false)}
                        className="border-white/20 text-zinc-300"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleManualPrice}
                        data-testid="save-manual-price-btn"
                        className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold"
                      >
                        Save Prices
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* Condition Details */}
            {card.damage_notes && !editing && (
              <div className="bg-zinc-900 border border-white/10 rounded-lg p-6">
                <h2 className="text-lg font-medium text-zinc-50 mb-3">Condition Notes</h2>
                <p className="text-zinc-400">{card.damage_notes}</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function PriceCard({ label, value, highlight }) {
  return (
    <div className={`text-center p-3 rounded-lg ${highlight ? "bg-amber-500/10" : "bg-zinc-800"}`}>
      <p className="text-xs text-zinc-400 uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-xl font-bold font-mono ${highlight ? "text-amber-500" : "text-zinc-50"}`}>
        ${value?.toFixed(2) || "0.00"}
      </p>
    </div>
  );
}
