import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import { Alert, Platform } from 'react-native';

import { isSupabaseConfigured, supabase } from './supabase';

export type ProfileImageKind = 'profile' | 'cover';

const PROFILE_DIR = `${FileSystem.documentDirectory ?? ''}profile-media/`;

async function ensureDir(userId: string): Promise<string> {
  const dir = `${PROFILE_DIR}${userId}/`;
  const info = await FileSystem.getInfoAsync(dir);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  }
  return dir;
}

async function requestLibraryPermission(): Promise<boolean> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert('Photos', 'Allow photo library access to set your profile or cover image.');
    return false;
  }
  return true;
}

async function requestCameraPermission(): Promise<boolean> {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert('Camera', 'Allow camera access to take a profile or cover photo.');
    return false;
  }
  return true;
}

function pickerOptions(kind: ProfileImageKind): ImagePicker.ImagePickerOptions {
  const aspect: [number, number] = kind === 'cover' ? [16, 9] : [1, 1];
  return {
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect,
    quality: 0.85,
  };
}

async function pickFromLibrary(kind: ProfileImageKind): Promise<string | null> {
  if (!(await requestLibraryPermission())) return null;
  const result = await ImagePicker.launchImageLibraryAsync(pickerOptions(kind));
  if (result.canceled || !result.assets[0]?.uri) return null;
  return result.assets[0].uri;
}

async function pickFromCamera(kind: ProfileImageKind): Promise<string | null> {
  if (!(await requestCameraPermission())) return null;
  const result = await ImagePicker.launchCameraAsync(pickerOptions(kind));
  if (result.canceled || !result.assets[0]?.uri) return null;
  return result.assets[0].uri;
}

export function promptPickProfileImage(kind: ProfileImageKind): Promise<string | null> {
  const label = kind === 'cover' ? 'cover photo' : 'profile picture';
  return new Promise((resolve) => {
    Alert.alert(`Change ${label}`, 'Choose a source', [
      {
        text: 'Photo library',
        onPress: () => void pickFromLibrary(kind).then(resolve),
      },
      {
        text: 'Camera',
        onPress: () => void pickFromCamera(kind).then(resolve),
      },
      { text: 'Cancel', style: 'cancel', onPress: () => resolve(null) },
    ]);
  });
}

/** Copy picked image into app storage and return a stable file URI. */
export async function persistProfileImage(
  userId: string,
  kind: ProfileImageKind,
  sourceUri: string
): Promise<string> {
  const dir = await ensureDir(userId);
  const filename = kind === 'cover' ? 'cover.jpg' : 'profile.jpg';
  const dest = `${dir}${filename}`;

  if (sourceUri.startsWith('file://') && sourceUri === dest) {
    return dest;
  }

  await FileSystem.copyAsync({ from: sourceUri, to: dest });
  const localUri = `${dest}?v=${Date.now()}`;

  if (isSupabaseConfigured && supabase) {
    try {
      const remote = await uploadToSupabase(userId, kind, localUri);
      if (remote) return remote;
    } catch (e) {
      console.warn('[profilePhotos] cloud upload failed, using local', e);
    }
  }

  return localUri;
}

async function uploadToSupabase(
  userId: string,
  kind: ProfileImageKind,
  localUri: string
): Promise<string | null> {
  if (!supabase) return null;

  const path = `${userId}/${kind}.jpg`;
  const base64 = await FileSystem.readAsStringAsync(localUri, {
    encoding: 'base64',
  });

  const bytes = base64ToUint8Array(base64);
  const { error } = await supabase.storage.from('profile-media').upload(path, bytes, {
    upsert: true,
    contentType: 'image/jpeg',
  });
  if (error) {
    console.warn('[profilePhotos] upload error', error.message);
    return null;
  }

  const { data } = supabase.storage.from('profile-media').getPublicUrl(path);
  return data.publicUrl ? `${data.publicUrl}?t=${Date.now()}` : null;
}

function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export async function removePersistedImage(userId: string, kind: ProfileImageKind): Promise<void> {
  const dir = `${PROFILE_DIR}${userId}/`;
  const filename = kind === 'cover' ? 'cover.jpg' : 'profile.jpg';
  const local = `${dir}${filename}`;
  const info = await FileSystem.getInfoAsync(local);
  if (info.exists) {
    await FileSystem.deleteAsync(local, { idempotent: true });
  }

  if (isSupabaseConfigured && supabase) {
    await supabase.storage.from('profile-media').remove([`${userId}/${kind}.jpg`]);
  }
}

export async function pickAndPersistProfileImage(
  userId: string,
  kind: ProfileImageKind
): Promise<string | null> {
  if (Platform.OS === 'web') {
    Alert.alert(
      'Photos',
      'Profile and cover photos can be changed in the Android app. Web preview does not support the photo picker.'
    );
    return null;
  }
  try {
    const picked = await promptPickProfileImage(kind);
    if (!picked) return null;
    return await persistProfileImage(userId, kind, picked);
  } catch (e) {
    console.warn('[profilePhotos] pick failed', e);
    Alert.alert('Could not save photo', 'Try another image or check photo permissions in Android Settings.');
    return null;
  }
}

/** Default cover gradient when user has no cover photo. */
export function defaultCoverColors(isDark: boolean): [string, string] {
  return isDark ? ['#2C2C52', '#7C5CFF'] : ['#D8D8EC', '#6B4FE0'];
}
