import { useEffect } from "react";
export function useBodyScrollLock(locked) {
    useEffect(() => {
        const prev = document.body.style.overflow;
        if (locked)
            document.body.style.overflow = "hidden";
        return () => { document.body.style.overflow = prev; };
    }, [locked]);
}
