# Handling Large Files

This project includes configuration to handle large files properly with Git. Here's a guide on how to work with large files in this repository.

## Files Ignored by Git

The following types of files are ignored by Git to keep the repository size manageable:

- Large media files (mp4, mov, mp3, etc.)
- Large data files (csv, zip, tar, etc.)
- Large image files (jpg, png, gif over 5MB)
- Database files (sqlite, db)
- Build artifacts and cache files

## Adding Large Files to the Project

### Option 1: Git LFS (Recommended for shared repositories)

If you need to track large files, we recommend using [Git Large File Storage (LFS)](https://git-lfs.github.com/).

1. Install Git LFS:
   ```bash
   # macOS (using Homebrew)
   brew install git-lfs
   
   # Windows (using Chocolatey)
   choco install git-lfs
   
   # Ubuntu/Debian
   sudo apt-get install git-lfs
   ```

2. Initialize Git LFS:
   ```bash
   git lfs install
   ```

3. Uncomment the relevant file types in `.gitattributes`

4. Track specific file types:
   ```bash
   git lfs track "*.psd"
   git lfs track "*.pdf"
   # Add other file types as needed
   ```

5. Add, commit, and push as normal:
   ```bash
   git add file.psd
   git commit -m "Add design file"
   git push
   ```

### Option 2: External Storage

For very large files that don't need version control:

1. Store large files externally (AWS S3, Google Cloud Storage, etc.)
2. Reference these files in your code via URLs
3. Document the external storage locations in your project documentation

### Option 3: Keep in .gitignore but include in releases

If the files are needed for the application but don't need to be version controlled:

1. Keep the files in a directory that's ignored by Git
2. Include instructions in your documentation on how to download/generate these files
3. Consider including these files in release packages if applicable

## Managing Uploads Directory

The `/uploads` and `/backend/uploads` directories are ignored except for `.gitkeep` files. This means:

1. User-uploaded files won't be tracked by Git
2. You'll need to back up these directories separately in production
3. Consider using cloud storage solutions for uploaded files in production

## For Contributors

When contributing to this project:

1. Don't force push large binary files
2. Use Git LFS for any necessary large files
3. If you need to add a new type of large file, update the `.gitignore` and `.gitattributes` files
4. Consider the impact on the repository size before committing large files 