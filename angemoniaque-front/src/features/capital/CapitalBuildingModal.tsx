import React, { useState } from 'react';
import { Store, ShoppingBag, Package, PlusCircle, ArrowRightLeft } from 'lucide-react';

interface CapitalBuildingModalProps {
  activeChar: any;
  factionShopItems: any[];
  setFactionShopItems: React.Dispatch<React.SetStateAction<any[]>>;
  marketListings: any[];
  setMarketListings: React.Dispatch<React.SetStateAction<any[]>>;
  onBuyShopItem: (item: any) => void;
  onBuyMarketListing: (listing: any) => void;
  onListBagItemOnMarket: (bagIndex: number, price: number) => void;
  onExpandChest: (cost: number) => void;
  onDepositToChest: (bagIndex: number) => void;
  onWithdrawFromChest: (chestIndex: number) => void;
}

export const CapitalBuildingModal: React.FC<CapitalBuildingModalProps> = ({
  activeChar,
  factionShopItems,
  marketListings,
  onBuyShopItem,
  onBuyMarketListing,
  onListBagItemOnMarket,
  onExpandChest,
  onDepositToChest,
  onWithdrawFromChest,
}) => {
  const [sellPrice, setSellPrice] = useState<number>(150);
  const chestItems = activeChar.chest || [];
  const chestCapacity = activeChar.chest_capacity || 5;
  // Coût progressif : plus on agrandit le coffre, plus cela coûte cher
  const nextExpansionCost = chestCapacity * 40;

  const capitalName =
    activeChar.race === 'Ange'
      ? 'Sanctuaire de la Providence'
      : activeChar.race === 'Demon'
      ? 'Bastion Infernal'
      : 'Hôtel de Ville';

  const sameRaceListings = marketListings.filter((l) => l.race === activeChar.race);

  return (
    <div className="space-y-4 text-xs">
      <div className="p-3 bg-amber-500/10 border border-amber-500/40 rounded-xl flex items-center justify-between">
        <div>
          <span className="font-extrabold text-amber-300 text-sm">{capitalName} ({activeChar.race})</span>
          <p className="text-slate-300 text-[11px]">
            Toutes les interactions dans ce bâtiment coûtent <b>0 Énergie</b>. Or disponible : <b className="text-yellow-300">{activeChar.gold} Or</b>.
          </p>
        </div>
        <span className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40">
          0 Énergie
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* 1. Boutique de la Faction (avec réserve de la faction) */}
        <div className="bg-slate-800/80 border border-amber-500/40 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-700 pb-2">
            <h3 className="font-bold text-sm text-amber-300 flex items-center gap-1.5">
              <Store className="w-4 h-4" /> Boutique de Faction
            </h3>
            <span className="text-[10px] text-slate-400">Réserve de Faction</span>
          </div>
          <p className="text-slate-400 text-[11px]">
            Outils de récolte, armes, sorts et parchemins de base vendus par la faction.
          </p>
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {factionShopItems.map((item) => (
              <div key={item.id} className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="font-bold text-white">{item.name}</div>
                  <div className="text-[10px] text-slate-400">
                    {item.weaponDamage ? `Arme ×${item.weaponDamage}` : item.armor ? `Armure +${item.armor}` : 'Outil / Parchemin'} • Stock : <b>{item.reserve}</b>
                  </div>
                </div>
                <button
                  disabled={item.reserve <= 0 || activeChar.gold < item.price}
                  onClick={() => onBuyShopItem(item)}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 disabled:bg-slate-700 disabled:text-slate-500 text-slate-950 font-extrabold rounded-lg"
                >
                  {item.price} Or
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* 2. Marketplace entre joueurs de la même race */}
        <div className="bg-slate-800/80 border border-emerald-500/40 rounded-xl p-4 space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between border-b border-slate-700 pb-2">
              <h3 className="font-bold text-sm text-emerald-300 flex items-center gap-1.5">
                <ShoppingBag className="w-4 h-4" /> Marché ({activeChar.race})
              </h3>
              <span className="text-[10px] text-slate-400">{sameRaceListings.length} offre(s)</span>
            </div>
            <p className="text-slate-400 text-[11px]">
              Achetez ou vendez équipements, sorts, montures et parchemins aux joueurs de votre race.
            </p>
            <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
              {sameRaceListings.map((listing) => (
                <div key={listing.id} className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-amber-200">{listing.item.name}</div>
                    <div className="text-[10px] text-slate-400">Vendeur : {listing.seller}</div>
                  </div>
                  <button
                    disabled={activeChar.gold < listing.price}
                    onClick={() => onBuyMarketListing(listing)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white font-bold rounded-lg"
                  >
                    Acheter ({listing.price} Or)
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-700 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-300">Mettre en vente depuis le sac :</span>
              <input
                type="number"
                min={10}
                step={10}
                value={sellPrice}
                onChange={(e) => setSellPrice(Number(e.target.value))}
                className="w-20 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-yellow-300 font-bold text-right"
              />
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
              {activeChar.bag.map((bItem: any, idx: number) => (
                <button
                  key={`${bItem.id}-${idx}`}
                  onClick={() => onListBagItemOnMarket(idx, sellPrice)}
                  className="px-2 py-1 bg-slate-900 hover:bg-emerald-700 border border-slate-700 rounded text-[10px] font-semibold"
                >
                  Vendre {bItem.name} ({sellPrice} Or)
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 3. Coffre Personnel Évolutif à coût progressif */}
        <div className="bg-slate-800/80 border border-sky-500/40 rounded-xl p-4 space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between border-b border-slate-700 pb-2">
              <h3 className="font-bold text-sm text-sky-300 flex items-center gap-1.5">
                <Package className="w-4 h-4" /> Coffre Personnel
              </h3>
              <span className="font-bold text-sky-200">
                {chestItems.length} / {chestCapacity} espaces
              </span>
            </div>
            <p className="text-slate-400 text-[11px]">
              Stockez vos objets en sécurité. Plus vous agrandissez votre coffre, plus l’espace supplémentaire coûte cher.
            </p>

            {/* Contenu du coffre */}
            <div className="space-y-1.5 max-h-36 overflow-y-auto">
              {chestItems.length > 0 ? (
                chestItems.map((cItem: any, cIdx: number) => (
                  <div key={`${cItem.id}-${cIdx}`} className="p-2 bg-slate-900 rounded flex items-center justify-between">
                    <span className="font-bold text-amber-200">{cItem.name}</span>
                    <button
                      onClick={() => onWithdrawFromChest(cIdx)}
                      className="px-2 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded text-[10px] font-bold"
                    >
                      Retirer vers le sac
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-slate-500 italic py-3 text-center">Votre coffre est vide.</div>
              )}
            </div>

            {/* Déposer depuis le sac */}
            {activeChar.bag.length > 0 && chestItems.length < chestCapacity && (
              <div className="pt-2 border-t border-slate-700">
                <div className="text-[10px] text-slate-400 mb-1 flex items-center gap-1">
                  <ArrowRightLeft className="w-3 h-3" /> Déposer un objet du sac dans le coffre :
                </div>
                <div className="flex flex-wrap gap-1">
                  {activeChar.bag.map((bItem: any, bIdx: number) => (
                    <button
                      key={`${bItem.id}-${bIdx}`}
                      onClick={() => onDepositToChest(bIdx)}
                      className="px-2 py-1 bg-slate-900 hover:bg-sky-700 border border-slate-700 rounded text-[10px]"
                    >
                      + {bItem.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button
            disabled={activeChar.gold < nextExpansionCost}
            onClick={() => onExpandChest(nextExpansionCost)}
            className="w-full py-2 px-3 bg-sky-600 hover:bg-sky-500 disabled:bg-slate-700 text-white font-extrabold rounded-lg flex items-center justify-center gap-1.5"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Agrandir (+1 espace) — {nextExpansionCost} Or</span>
          </button>
        </div>
      </div>
    </div>
  );
};