const LoadingSpinner = () => {
    return (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-900/10 backdrop-blur-sm z-50">
            <div className="flex flex-col items-center gap-3">
                {/* The Spinner Circle */}
                <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
        </div>
    );
};

export default LoadingSpinner;