import { useState, useEffect, useCallback } from "react";
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

const CONDITIONS = [
  "Mint",
  "Near Mint",
  "Excellent",
  "Good",
  "Fair",
  "Poor",
];

export default function CardDetail() {
  const { cardId } = useParams();
  const navigate = useNavigate();
  const [card, setCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [saving, setSaving] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showPriceDialog, setShowPriceDialog] = useState(false);
  const [manualPrice, setManualPrice] = useState({
    avg_price: "",
    top_price: "",
    bottom_price: "",
  });

  const fetchCard = useCallback(async () => {
    setLoading(true);
  try {
    const response = await axios.get(`${API}/cards/${cardId}`);
    setCard(response.data);
    setEditData(response.data);
    setManualPrice({
      avg_price: response.data.avg_price != null ? String(response.data.avg_price) : "",
      top_price: response.data.top_price != null ? String(response.data.top_price) : "",
      bottom_price: response.data.bottom_price != null ? String(response.data.bottom_price) : "",
    });
  } catch (error) {
    console.error("Error fetching card:", error);
    toast.error("Card not found");
    navigate("/dashboard");
  } finally {
    setLoading(false);
  }
}, [cardId, navigate]);

useEffect(() => {
  fetchCard();
}, [fetchCard]);
  

  const handleSaveEdit = async () => {
    setSaving(true);
    try {
      const response = await axios.put(`${API}/cards/${cardId}`, {
        card_name: editData.card_name,
        card_type: editData.card_type,
        card_year: editData.card_year || null,
        condition: editData.condition || null,
        notes: editData.notes || null,
      });

      setCard(response.data);
      setEditData(response.data);
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

  const handleManualPrice = async () => {
    if (!manualPrice.avg_price || !manualPrice.top_price || !manualPrice.bottom_price) {
      toast.error("Please fill in all price fields");
      return;
    }

    try {
      const response = await axios.put(`${API}/cards/${cardId}/price`, {
        avg_price: parseFloat(manualPrice.avg_price),
        top_price: parseFloat(manualPrice.top_price),
        bottom_price: parseFloat(manualPrice.bottom_price),
        price_source: "manual",
      });

      setCard(response.data);
      setShowPriceDialog(false);
      toast.success("Prices updated");
    } catch (error) {
      console.error("Manual price error:", error);
      toast.error("Failed to update prices");
    }
  };

  const getConditionBadge = (condition, notes) => {
    const normalizedCondition = (condition || "").toLowerCase();
    const normalizedNotes = (notes || "").toLowerCase();

    if (
      normalizedCondition.includes("mint") ||
      normalizedNotes.includes("mint") ||
      normalizedNotes.includes("no damage")
    ) {
      return <Badge className="badge-mint">Mint</Badge>;
    }

    if (
      normalizedCondition.includes("near") ||
      normalizedCondition.includes("excellent") ||
      normalizedNotes.includes("minor") ||
      normalizedNotes.includes("light")
    ) {
      return <Badge className="badge-near-mint">Near Mint</Badge>;
    }

    if (!normalizedCondition && !normalizedNotes) {
      return <Badge className="bg-zinc-700 text-zinc-200">Unknown</Badge>;
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
          <div className="space-y-4">
            <div className="bg-zinc-900 border border-white/10 rounded-lg overflow-hidden">
              <div className="p-3 border-b border-white/10">
                <p className="text-xs text-zinc-400 uppercase tracking-wider">Front</p>
              </div>
              <div className="aspect-[3/4] bg-zinc-800">
                {card.image_front_base64 ? (
                  <img
                    src={`data:image/jpeg;base64,${card.image_front_base64}`}
                    alt={`${card.card_name} - Front`}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <CreditCard className="w-16 h-16 text-zinc-600" />
                  </div>
                )}
              </div>
            </div>

            <div className="bg-zinc-900 border border-white/10 rounded-lg overflow-hidden">
              <div className="p-3 border-b border-white/10">
                <p className="text-xs text-zinc-400 uppercase tracking-wider">Back</p>
              </div>
              <div className="aspect-[3/4] bg-zinc-800">
                {card.image_back_base64 ? (
                  <img
                    src={`data:image/jpeg;base64,${card.image_back_base64}`}
                    alt={`${card.card_name} - Back`}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <CreditCard className="w-16 h-16 text-zinc-600" />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                {editing ? (
                  <Input
                    value={editData.card_name || ""}
                    onChange={(e) => setEditData({ ...editData, card_name: e.target.value })}
                    data-testid="edit-card-name"
                    className="text-2xl font-bold bg-zinc-900 border-white/10 text-zinc-50 mb-2"
                  />
                ) : (
                  <h1 className="text-2xl sm:text-3xl font-bold text-zinc-50 mb-2">
                    {card.card_name}
                  </h1>
                )}

                <div className="flex flex-wrap items-center gap-3">
                  {getConditionBadge(card.condition, card.notes)}
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

            {editing && (
              <div className="bg-zinc-900 border border-white/10 rounded-lg p-4 space-y-4">
                <div>
                  <Label className="text-zinc-300">Card Type</Label>
                  <Select
                    value={editData.card_type || ""}
                    onValueChange={(value) => setEditData({ ...editData, card_type: value })}
                  >
                    <SelectTrigger
                      data-testid="edit-card-type"
                      className="mt-1 bg-zinc-950 border-white/10 text-zinc-50"
                    >
                      <SelectValue placeholder="Select card type" />
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
                  <Label className="text-zinc-300">Condition</Label>
                  <Select
                    value={editData.condition || ""}
                    onValueChange={(value) => setEditData({ ...editData, condition: value })}
                  >
                    <SelectTrigger
                      data-testid="edit-condition"
                      className="mt-1 bg-zinc-950 border-white/10 text-zinc-50"
                    >
                      <SelectValue placeholder="Select condition" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-white/10">
                      {CONDITIONS.map((condition) => (
                        <SelectItem
                          key={condition}
                          value={condition}
                          className="text-zinc-50 hover:bg-zinc-800 focus:bg-zinc-800"
                        >
                          {condition}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-zinc-300">Notes</Label>
                  <Textarea
                    value={editData.notes || ""}
                    onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                    data-testid="edit-notes"
                    rows={3}
                    className="mt-1 bg-zinc-950 border-white/10 text-zinc-50 resize-none"
                  />
                </div>
              </div>
            )}

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

              {card.avg_price != null ? (
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <PriceCard label="Average" value={card.avg_price} />
                  <PriceCard label="High" value={card.top_price} highlight />
                  <PriceCard label="Low" value={card.bottom_price} />
                </div>
              ) : (
                <p className="text-zinc-400 text-sm mb-6">No price data available</p>
              )}

              <div className="flex gap-3">
                <Dialog open={showPriceDialog} onOpenChange={setShowPriceDialog}>
                  <DialogTrigger asChild>
                    <Button
                      className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold"
                      data-testid="manual-price-btn"
                    >
                      <DollarSign className="w-4 h-4 mr-2" />
                      Edit Prices
                    </Button>
                  </DialogTrigger>

                  <DialogContent className="bg-zinc-900 border-white/10">
                    <DialogHeader>
                      <DialogTitle className="text-zinc-50">Enter Prices Manually</DialogTitle>
                      <DialogDescription className="text-zinc-400">
                        Enter the average, high, and low values for this card.
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

            {card.notes && !editing && (
              <div className="bg-zinc-900 border border-white/10 rounded-lg p-6">
                <h2 className="text-lg font-medium text-zinc-50 mb-3">Notes</h2>
                <p className="text-zinc-400 whitespace-pre-wrap">{card.notes}</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function PriceCard({ label, value, highlight }) {
  const displayValue = Number(value ?? 0);

  return (
    <div className={`text-center p-3 rounded-lg ${highlight ? "bg-amber-500/10" : "bg-zinc-800"}`}>
      <p className="text-xs text-zinc-400 uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-xl font-bold font-mono ${highlight ? "text-amber-500" : "text-zinc-50"}`}>
        ${displayValue.toFixed(2)}
      </p>
    </div>
  );
} 