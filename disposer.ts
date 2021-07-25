export interface Disposable {
    dispose: () => void
}

export class Disposer {
    disposables: Set<WeakRef<Disposable>> = new Set
    finalizer: FinalizationRegistry<WeakRef<Disposable>>

    constructor() {
        this.finalizer = new FinalizationRegistry(
            weakRef => this.disposables.delete(weakRef)
        )
    }

    add(disposable: Disposable): this {
        const weakRef = new WeakRef(disposable)
        this.finalizer.register(disposable, weakRef)
        this.disposables.add(weakRef)
        return this
    }

    dispose() {
        for (const weakRef of this.disposables) {
            const disposable = weakRef.deref()
            if (disposable) disposable.dispose()
        }
        this.disposables.clear()
    }
}
