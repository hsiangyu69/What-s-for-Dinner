import { useState, useRef } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Camera, ChefHat, Loader2, X, ImagePlus } from 'lucide-react';
import Markdown from 'react-markdown';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export default function App() {
  const [ingredients, setIngredients] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ingredients.trim() && !image) return;

    setIsLoading(true);
    setResult(null);

    try {
      const parts: any[] = [];
      
      if (ingredients.trim()) {
        parts.push({ text: `Here are the ingredients I have: ${ingredients}` });
      }

      if (image) {
        const base64Data = imagePreview?.split(',')[1];
        if (base64Data) {
          parts.push({
            inlineData: {
              data: base64Data,
              mimeType: image.type,
            },
          });
        }
      }

      parts.push({ text: "Based on these ingredients (and/or the image provided), suggest 3 creative and delicious dinner ideas. For each idea, provide a brief description and a simple recipe. Format the response in Markdown." });

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts },
      });

      setResult(response.text || 'No ideas generated. Please try again.');
    } catch (error) {
      console.error('Error generating dinner ideas:', error);
      setResult('An error occurred while generating ideas. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans selection:bg-orange-200">
      <div className="max-w-3xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <header className="text-center mb-12">
          <div className="inline-flex items-center justify-center p-3 bg-orange-100 rounded-2xl mb-4">
            <ChefHat className="w-8 h-8 text-orange-600" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-stone-900 sm:text-5xl mb-4">
            What's for Dinner?
          </h1>
          <p className="text-lg text-stone-600 max-w-xl mx-auto">
            Tell us what ingredients you have, or snap a picture of your fridge, and we'll whip up some delicious ideas.
          </p>
        </header>

        <main className="space-y-8">
          <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-sm border border-stone-200/60 p-6 sm:p-8 space-y-6">
            
            <div className="space-y-2">
              <label htmlFor="ingredients" className="block text-sm font-medium text-stone-700">
                What do you have? (Optional if uploading a photo)
              </label>
              <textarea
                id="ingredients"
                rows={3}
                className="block w-full rounded-xl border-stone-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm p-4 bg-stone-50 border transition-colors resize-none"
                placeholder="e.g., chicken breast, broccoli, rice, soy sauce..."
                value={ingredients}
                onChange={(e) => setIngredients(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-stone-700">
                Add a photo of your ingredients
              </label>
              
              {!imagePreview ? (
                <div 
                  className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-stone-300 border-dashed rounded-xl hover:border-orange-400 hover:bg-orange-50/50 transition-colors cursor-pointer group"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="space-y-2 text-center">
                    <div className="mx-auto h-12 w-12 text-stone-400 group-hover:text-orange-500 transition-colors flex items-center justify-center bg-stone-100 group-hover:bg-orange-100 rounded-full">
                      <ImagePlus className="h-6 w-6" />
                    </div>
                    <div className="flex text-sm text-stone-600 justify-center mt-4">
                      <span className="relative rounded-md font-medium text-orange-600 hover:text-orange-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-orange-500">
                        Upload a file
                      </span>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-stone-500 mt-1">PNG, JPG, GIF up to 10MB</p>
                  </div>
                </div>
              ) : (
                <div className="relative rounded-xl overflow-hidden border border-stone-200 bg-stone-100 group">
                  <img 
                    src={imagePreview} 
                    alt="Ingredients preview" 
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeImage();
                      }}
                      className="bg-white/20 hover:bg-white/30 backdrop-blur-md text-white rounded-full p-2 transition-colors"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                </div>
              )}
              
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleImageChange}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || (!ingredients.trim() && !image)}
              className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" />
                  Cooking up ideas...
                </>
              ) : (
                'Get Dinner Ideas'
              )}
            </button>
          </form>

          {result && (
            <div className="bg-white rounded-3xl shadow-sm border border-stone-200/60 p-6 sm:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-2xl font-semibold text-stone-900 mb-6 flex items-center gap-2">
                <ChefHat className="w-6 h-6 text-orange-500" />
                Your Menu
              </h2>
              <div className="prose prose-stone prose-orange max-w-none prose-headings:font-semibold prose-a:text-orange-600 hover:prose-a:text-orange-500 prose-img:rounded-xl">
                <Markdown>{result}</Markdown>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
