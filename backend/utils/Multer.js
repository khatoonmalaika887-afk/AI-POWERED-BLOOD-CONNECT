import multer from 'multer';

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Define the directory where the file will be saved
        cb(null, './uploads/'); // `uploads` folder should be created in your root directory
    },
    filename: (req, file, cb) => {
        // Set the file name as a timestamp + the original file name
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const fileFilter = (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed!'), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    }
});

export default upload;