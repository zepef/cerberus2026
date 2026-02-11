interface EntityBioProps {
  biography: string[];
}

export function EntityBio({ biography }: EntityBioProps) {
  if (biography.length === 0) return null;

  return (
    <div className="glass-card rounded-xl p-6">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-300">
        Biography
      </h2>
      <div className="space-y-3">
        {biography.map((paragraph, i) => (
          <p key={i} className="text-sm leading-relaxed text-zinc-300">
            {paragraph}
          </p>
        ))}
      </div>
    </div>
  );
}
