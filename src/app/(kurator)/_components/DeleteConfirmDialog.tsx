'use client'

import { useRef } from 'react'

interface Props {
  itemName: string
  onConfirm: () => void
  children: React.ReactNode
}

export default function DeleteConfirmDialog({ itemName, onConfirm, children }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className="btn-danger rounded-md px-2 py-0.5 text-xs font-medium"
      >
        {children}
      </button>
      <dialog
        ref={dialogRef}
        className="rounded-lg border border-gray-200 bg-white p-6 shadow-lg backdrop:bg-black/30"
      >
        <h3 className="mb-2 text-sm font-semibold text-gray-900">Bekräfta radering</h3>
        <p className="mb-4 text-sm text-gray-600">
          Vill du radera <strong>{itemName}</strong>? Detta kan inte ångras.
        </p>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            className="btn-secondary rounded-md px-4 py-1.5 text-sm font-medium"
          >
            Avbryt
          </button>
          <button
            type="button"
            onClick={() => {
              dialogRef.current?.close()
              onConfirm()
            }}
            className="btn-danger rounded-md px-4 py-1.5 text-sm font-medium"
          >
            Radera
          </button>
        </div>
      </dialog>
    </>
  )
}
