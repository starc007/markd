use std::fs;
use std::io::{self, Write};
use std::path::PathBuf;

pub struct FileService {
    base_path: PathBuf,
    notes_path: PathBuf,
}

impl FileService {
    pub fn new() -> io::Result<Self> {
        let base_path = dirs::document_dir()
            .ok_or_else(|| io::Error::new(io::ErrorKind::NotFound, "Documents directory not found"))?
            .join("Draft");
        
        let notes_path = base_path.join("notes");
        
        // Ensure directories exist
        fs::create_dir_all(&notes_path)?;
        
        Ok(FileService {
            base_path,
            notes_path,
        })
    }

    pub fn get_base_path(&self) -> &PathBuf {
        &self.base_path
    }

    pub fn get_db_path(&self) -> PathBuf {
        self.base_path.join("draft.db")
    }

    pub fn get_note_path(&self, note_id: &str) -> PathBuf {
        self.notes_path.join(format!("{}.md", note_id))
    }

    pub fn write_note(&self, note_id: &str, content: &str) -> io::Result<PathBuf> {
        let path = self.get_note_path(note_id);
        let mut file = fs::File::create(&path)?;
        file.write_all(content.as_bytes())?;
        file.sync_all()?;
        Ok(path)
    }

    pub fn read_note(&self, note_id: &str) -> io::Result<String> {
        let path = self.get_note_path(note_id);
        fs::read_to_string(&path)
    }

    pub fn delete_note(&self, note_id: &str) -> io::Result<()> {
        let path = self.get_note_path(note_id);
        if path.exists() {
            fs::remove_file(&path)?;
        }
        Ok(())
    }

    pub fn note_exists(&self, note_id: &str) -> bool {
        self.get_note_path(note_id).exists()
    }

    pub fn export_note(&self, note_id: &str, destination: &PathBuf) -> io::Result<()> {
        let content = self.read_note(note_id)?;
        let mut file = fs::File::create(destination)?;
        file.write_all(content.as_bytes())?;
        file.sync_all()?;
        Ok(())
    }

    pub fn get_all_note_files(&self) -> io::Result<Vec<String>> {
        let mut note_ids = Vec::new();
        
        for entry in fs::read_dir(&self.notes_path)? {
            let entry = entry?;
            let path = entry.path();
            
            if path.is_file() {
                if let Some(ext) = path.extension() {
                    if ext == "md" {
                        if let Some(stem) = path.file_stem() {
                            if let Some(id) = stem.to_str() {
                                note_ids.push(id.to_string());
                            }
                        }
                    }
                }
            }
        }
        
        Ok(note_ids)
    }
}
