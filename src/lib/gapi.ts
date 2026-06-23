import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User, signOut } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { getMembers, getMedicalRecords, getPrescriptions, getReminders, getHealthMetrics, getExpenses, getDocuments } from './db';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/spreadsheets');
provider.addScope('https://www.googleapis.com/auth/drive.file');

let isSigningIn = false;
let cachedAccessToken: string | null = null;

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to get access token from Firebase Auth');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const logoutGoogle = async () => {
  await signOut(auth);
  cachedAccessToken = null;
};

export async function exportDataToGoogleSheets(familyId: string, accessToken: string) {
  // 1. Create a new Spreadsheet
  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title: `Family Medical Vault Backup - ${new Date().toLocaleDateString()}`,
      },
    }),
  });
  
  const createData = await createRes.json();
  if (!createRes.ok) {
    throw new Error(createData.error?.message || 'Failed to create spreadsheet');
  }
  
  const spreadsheetId = createData.spreadsheetId;
  const spreadsheetUrl = createData.spreadsheetUrl;
  const firstSheetTitle = createData.sheets[0].properties.title;

  const records = getMedicalRecords(familyId);
  
  // Format Data to 2D Array
  const values = [
    ['ID', 'Date', 'Hospital', 'Department', 'Doctor', 'Reason', 'Symptoms', 'Diagnosis', 'Conclusion', 'Treatment']
  ];

  for (const r of records) {
    values.push([
      r.id,
      r.date,
      r.hospital,
      r.department || '',
      r.doctor,
      r.reason,
      r.symptoms || '',
      r.diagnosis || '',
      r.conclusion || '',
      r.treatment || ''
    ]);
  }

  // 2. Write Data to the First Sheet
  const range = `'${firstSheetTitle}'!A1:J${values.length}`;
  const writeRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      values
    }),
  });

  const writeData = await writeRes.json();
  if (!writeRes.ok) {
    throw new Error(writeData.error?.message || 'Failed to write to spreadsheet');
  }

  return spreadsheetUrl;
}
