'use client';
import {ArrowUpRight,Globe} from 'lucide-react';
import type {ProductFamily} from '@/lib/catalog-families';
import {familyOptions,familyPrice,regionLabel} from '@/lib/catalog-families';
import {ProductImage} from './ProductImage';
import {TiltCard} from '@/components/panelui/tilt-card';

export function CatalogFamilyCard({family:f,ru,region='all',priority=false,onOpen}:{family:ProductFamily;ru:boolean;region?:string;priority?:boolean;onOpen:()=>void}){
  const price=familyPrice(f,region),art=f.products.find(p=>p.imageSource==='supplier'&&p.imageUrl)??f.products[0];
  return (
    <article className="cf-card">
      <button className="cf-card-image" onClick={onOpen} aria-label={(ru?'Купить: ':'Buy: ')+f.name}>
        <TiltCard tilt={8} color="info" glare className="w-full h-full overflow-hidden">
          <TiltCard.Layer depth={10}>
            <ProductImage name={f.name} category={f.category} imageUrl={art.imageSource==='supplier'?art.imageUrl:undefined} priority={priority}/>
          </TiltCard.Layer>
        </TiltCard>
      </button>
      <div className="cf-card-body">
        <span className="cf-card-meta">{f.type==='voucher'?(ru?'Коды и карты':'Vouchers & cards'):f.type==='direct_topup'?(ru?'Пополнение':'Top-up'):'eSIM'}<span><Globe size={13}/>{region==='all'?f.regions.length+' '+(ru?'рег.':'regions'):regionLabel(region,ru)}</span></span>
        <h2>{f.name}</h2>
        <p>{familyOptions(f,region)} {ru?'вариантов номинала':'denomination options'}</p>
        <div className="cf-card-bottom">
          <strong>{price===null?(ru?'Цена не указана':'No supplied price'):<>{ru?'От ':'From '}{new Intl.NumberFormat(ru?'ru-RU':'en-US',{minimumFractionDigits:2,maximumFractionDigits:4}).format(price)} <small>{f.currency}</small></>}</strong>
          <button className="cf-buy-btn" onClick={onOpen} aria-label={(ru?'Купить (USDC): ':'Pay with USDC: ')+f.name}>{ru?'Купить (USDC)':'Pay with USDC'}<ArrowUpRight size={16}/></button>
        </div>
      </div>
    </article>
  );
}
