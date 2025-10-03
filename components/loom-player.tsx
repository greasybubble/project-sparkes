import * as React from 'react';
import {
  ActivityIndicator,
  Linking,
  Platform,
  Pressable,
  Text,
  View,
  ViewStyle,
} from 'react-native';

type Props = {
  /** Loom share URL or just the video ID */
  video: string;
  /** Aspect ratio (width / height), default 16/9 */
  aspectRatio?: number;
  style?: ViewStyle;
};

function parseId(input: string) {
  const m = input.match(/(?:share|embed)\/([A-Za-z0-9]+)/);
  return m ? m[1] : input;
}
function toEmbedUrl(input: string) {
  const id = parseId(input);
  return `https://www.loom.com/embed/${id}?hide_title=true&hide_owner=true&hide_share=true&autoplay=0`;
}
function toShareUrl(input: string) {
  const id = parseId(input);
  return `https://www.loom.com/share/${id}`;
}

export default function LoomPlayer({ video, aspectRatio = 16 / 9, style }: Props) {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [reloadKey, setReloadKey] = React.useState(0);

  const embedUrl = React.useMemo(() => toEmbedUrl(video), [video]);
  const shareUrl = React.useMemo(() => toShareUrl(video), [video]);

  const retry = () => {
    setError(null);
    setLoading(true);
    setReloadKey((k) => k + 1);
  };

  const containerStyle: ViewStyle = {
    width: '100%',
    aspectRatio,
    borderRadius: 0,
    overflow: 'hidden',
    backgroundColor: '#000',
  };

  const webContainerStyle: React.CSSProperties = {
  position: 'relative',
  width: '100%',

  aspectRatio: String(aspectRatio),
  borderRadius: 0,
  overflow: 'hidden',
  backgroundColor: '#000',
};

const iframeStyle: React.CSSProperties = {
  position: 'absolute',
  top: 0, right: 0, bottom: 0, left: 0,
  width: '100%',
  height: '100%',
  border: 0,
};

  if (Platform.OS !== 'web') {

    const WebView = require('react-native-webview').default;
    return (
      <View style={[containerStyle, style]}>
        <WebView
          key={reloadKey}
          source={{ uri: embedUrl }}
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
          javaScriptEnabled
          domStorageEnabled
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          onError={() => {
            setError('Could not load video.');
            setLoading(false);
          }}
        />

        {loading && !error && (
          <View style={styles.overlayCenter}>
            <ActivityIndicator size="large" />
          </View>
        )}

        {error && (
          <View style={styles.overlayCenter}>
            <Text style={styles.errorText}>{error}</Text>
            <View style={styles.row}>
              <Pressable onPress={retry} style={styles.btnSolid}>
                <Text style={styles.btnText}>Retry</Text>
              </Pressable>
              <Pressable onPress={() => Linking.openURL(shareUrl)} style={styles.btnOutline}>
                <Text style={styles.btnText}>Open in browser</Text>
              </Pressable>
            </View>
          </View>
        )}
      </View>
    );
  }

return (
  <div style={webContainerStyle}>
    <iframe
      key={reloadKey}
      src={embedUrl}
      allow="autoplay; fullscreen; picture-in-picture"
      style={iframeStyle}
      onLoad={() => setLoading(false)}
      onError={() => { setError('Could not load video.'); setLoading(false); }}
      loading="lazy"
    />
    {loading && !error && <div style={webStyles.spinnerOverlay}>Loading…</div>}
    {error && (
      <div style={webStyles.errorOverlay}>
        <div style={{ marginBottom: 8 }}>{error}</div>
        <button onClick={retry} style={webStyles.btnSolid}>Retry</button>
        <a href={shareUrl} target="_blank" rel="noreferrer" style={webStyles.btnOutline}>
          Open in browser
        </a>
      </div>
    )}
  </div>
);

}

const styles = {
  overlayCenter: {
    position: 'absolute' as const,
    top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: 'rgba(0,0,0,0.35)',
    padding: 12,
  },
  errorText: { color: '#fff', marginBottom: 8 },
  row: { flexDirection: 'row' as const },
  btnSolid: {
    backgroundColor: '#1f6feb',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
  },
  btnOutline: {
    borderColor: '#fff',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  btnText: { color: '#fff', fontWeight: '600' as const },
};

const webStyles = {
  baseOverlay: {
    position: 'absolute' as const,
    inset: 0,
    display: 'flex',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    background: 'rgba(0,0,0,0.35)',
    color: '#fff',
    gap: 8,
  },
  spinnerOverlay: {
    position: 'absolute' as const,
    inset: 0,
    display: 'flex',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    background: 'rgba(0,0,0,0.35)',
    color: '#fff',
    fontWeight: 600,
  },
  errorOverlay: {
    position: 'absolute' as const,
    inset: 0,
    display: 'flex',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    background: 'rgba(0,0,0,0.45)',
    color: '#fff',
    gap: 8,
    padding: 12,
    textAlign: 'center' as const,
  },
  btnSolid: {
    background: '#1f6feb',
    border: 0,
    borderRadius: 8,
    padding: '8px 12px',
    color: '#fff',
    fontWeight: 600,
    cursor: 'pointer',
    marginRight: 8,
  },
  btnOutline: {
    border: '1px solid #fff',
    borderRadius: 8,
    padding: '8px 12px',
    color: '#fff',
    fontWeight: 600,
    textDecoration: 'none',
  },
};

