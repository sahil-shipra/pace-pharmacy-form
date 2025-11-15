import { useState, useEffect, type Dispatch, type SetStateAction } from "react";

function useSessionStorage<T>(key: string, initialValue: T) {
    const [value, setValue] = useState<T>(() => {
        try {
            const saved = sessionStorage.getItem(key);
            return saved ? (JSON.parse(saved) as T) : initialValue;
        } catch (error) {
            console.error("Error reading sessionStorage key:", key, error);
            return initialValue;
        }
    });

    useEffect(() => {
        try {
            sessionStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.error("Error writing to sessionStorage key:", key, error);
        }
    }, [key, value]);

    return [value, setValue] as [T, Dispatch<SetStateAction<T>>];
}

export default useSessionStorage;
