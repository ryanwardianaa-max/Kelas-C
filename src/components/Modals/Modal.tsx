import type { ReactNode } from 'react'
import { X } from '../Icons'
export default function Modal({title,onClose,children}:{title:string;onClose:()=>void;children:ReactNode}){return <div className="modal-backdrop" onMouseDown={e=>e.target===e.currentTarget&&onClose()}><section className="modal" role="dialog" aria-modal="true"><header><h2>{title}</h2><button className="icon" onClick={onClose} aria-label="Tutup"><X/></button></header>{children}</section></div>}
