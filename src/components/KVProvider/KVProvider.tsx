import {
  createContext,
  Dispatch,
  FC,
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { Store } from 'tauri-plugin-store-api'
import { AVAILABLE_SETTINGS, PTSettingsKeyType } from '../../utils'

type KVContextType = {
  children?: React.ReactNode

  isLoading?: boolean
  pianoSound?: string
  showKeyboard?: boolean
  muteSound?: boolean

  setIsLoading?: Dispatch<SetStateAction<boolean>>
  setPianoSound?: Dispatch<SetStateAction<string>>
  setShowKeyboard?: Dispatch<SetStateAction<boolean>>
  setMuteSound?: Dispatch<SetStateAction<boolean>>

  saveSetting?: (key: PTSettingsKeyType, value: any) => void
}

export const KVContext = createContext({} as KVContextType)

/**
 * Responsible for providing persistant storage and reacting to
 * modified states (Settings)
 */
const KVProvider: FC<KVContextType> = ({ children }) => {
  const store = useMemo(() => new Store('.settings.dat'), [])
  const [isLoading, setIsLoading] = useState(true)
  const [pianoSound, setPianoSound] = useState('acoustic_grand_piano')
  const [showKeyboard, setShowKeyboard] = useState(true)
  const [muteSound, setMuteSound] = useState(false)

  /**
   * Store value on-disk
   */
  const saveSetting = useCallback(
    (key: PTSettingsKeyType, value: any) => {
      if (isLoading) return
      store.set(key, value)
      store.save()
    },
    [store, isLoading]
  )

  useEffect(() => {
    saveSetting('piano-sound', pianoSound)
  }, [pianoSound, saveSetting])

  useEffect(() => {
    saveSetting('show-keyboard', showKeyboard)
  }, [showKeyboard, saveSetting])

  useEffect(() => {
    saveSetting('mute-sound', muteSound)
  }, [muteSound, saveSetting])

  /**
   * Map settings stored on-disk into the KVProvider's state
   */
  const loadSettingIntoState = useCallback(
    async (key: PTSettingsKeyType) => {
      const value: string | boolean | null = await store.get(key)
      if (!value) {
        return
      }

      switch (key) {
        case 'piano-sound':
          setPianoSound(String(value))
          break
        case 'show-keyboard':
          setShowKeyboard(Boolean(value))
          break
        case 'mute-sound':
          setMuteSound(Boolean(value))
          break
      }
    },
    [setPianoSound, setShowKeyboard, setMuteSound, store]
  )

  /**
   * We want to fetch all of the settings stored on-disk and
   * load them into the state when KVProvider is mounted
   */
  useEffect(() => {
    store
      .load()
      .then(async () => {
        for (const key in AVAILABLE_SETTINGS) {
          await loadSettingIntoState(key as PTSettingsKeyType)
        }
      })
      .catch((e) => console.error(e))
      .finally(() => setIsLoading(false))
  }, [store, loadSettingIntoState, setIsLoading])

  const context: KVContextType = {
    isLoading,
    pianoSound,
    showKeyboard,
    muteSound,
    setIsLoading,
    setPianoSound,
    setShowKeyboard,
    setMuteSound,
    saveSetting,
  }

  return (
    <KVContext.Provider value={context}>
      {!isLoading && children}
    </KVContext.Provider>
  )
}

export default KVProvider