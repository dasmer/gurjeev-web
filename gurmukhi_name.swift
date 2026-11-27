import Foundation
import CoreText
import CoreGraphics

// Creates a 102 × 45 × 3.4 mm Gurmukhi nameplate: ਗੁਰਜੀਵ (Gurjeev).
let name = "ਗੁਰਜੀਵ"
let font = CTFontCreateWithName("Gurmukhi Sangam MN" as CFString, 220, nil)
let scale = 0.15, margin = 6.0, pixel = 0.30, baseHeight = 2.0, letterHeight = 1.4
let output = "gurjeev-gurmukhi-nameplate.stl"
struct Point { var x: Double; var y: Double }
typealias Contour = [Point]
var contours: [Contour] = []

func quadratic(_ p0: Point, _ c: Point, _ p1: Point, _ out: inout Contour) {
    for i in 1...8 { let t = Double(i)/8, u = 1-t; out.append(Point(x:u*u*p0.x+2*u*t*c.x+t*t*p1.x, y:u*u*p0.y+2*u*t*c.y+t*t*p1.y)) }
}
func cubic(_ p0: Point, _ c1: Point, _ c2: Point, _ p1: Point, _ out: inout Contour) {
    for i in 1...12 { let t = Double(i)/12, u = 1-t; out.append(Point(x:u*u*u*p0.x+3*u*u*t*c1.x+3*u*t*t*c2.x+t*t*t*p1.x, y:u*u*u*p0.y+3*u*u*t*c1.y+3*u*t*t*c2.y+t*t*t*p1.y)) }
}
let attributed = NSAttributedString(string: name, attributes: [kCTFontAttributeName as NSAttributedString.Key: font])
let line = CTLineCreateWithAttributedString(attributed)
for run in CTLineGetGlyphRuns(line) as! [CTRun] {
    let count = CTRunGetGlyphCount(run); var glyphs = Array(repeating: CGGlyph(), count: count); var positions = Array(repeating: CGPoint.zero, count: count)
    CTRunGetGlyphs(run, CFRange(location: 0, length: 0), &glyphs); CTRunGetPositions(run, CFRange(location: 0, length: 0), &positions)
    for i in 0..<count { guard let path = CTFontCreatePathForGlyph(font, glyphs[i], nil) else { continue }
        var current: Contour = []; var cursor = Point(x:0,y:0); let offset = Point(x:positions[i].x,y:positions[i].y)
        func finish() { if current.count > 2 { contours.append(current) }; current=[] }
        path.applyWithBlock { ptr in let e=ptr.pointee; func p(_ n:Int)->Point { Point(x:e.points[n].x+offset.x,y:e.points[n].y+offset.y) }
            switch e.type {
            case .moveToPoint: finish(); cursor=p(0); current=[cursor]
            case .addLineToPoint: cursor=p(0); current.append(cursor)
            case .addQuadCurveToPoint: let c=p(0), end=p(1); quadratic(cursor,c,end,&current); cursor=end
            case .addCurveToPoint: let c1=p(0), c2=p(1), end=p(2); cubic(cursor,c1,c2,end,&current); cursor=end
            case .closeSubpath: finish()
            @unknown default: break
            }
        }; finish()
    }
}
let points=contours.flatMap{$0}, minX=points.map(\.x).min()!, maxX=points.map(\.x).max()!, minY=points.map(\.y).min()!, maxY=points.map(\.y).max()!
let width=(maxX-minX)*scale+2*margin, depth=(maxY-minY)*scale+2*margin
let paths=contours.map{$0.map{Point(x:($0.x-minX)*scale+margin,y:($0.y-minY)*scale+margin)}}
func winding(_ p:Point,_ path:Contour)->Int { var w=0; for i in path.indices { let a=path[i], b=path[(i+1)%path.count], cross=(b.x-a.x)*(p.y-a.y)-(p.x-a.x)*(b.y-a.y); if a.y<=p.y { if b.y>p.y && cross>0 {w += 1} } else if b.y<=p.y && cross<0 {w -= 1} }; return w }
func filled(_ p:Point)->Bool { paths.reduce(0){$0+winding(p,$1)} != 0 }

struct Vec { var x:Float; var y:Float; var z:Float }
var triangles:[(Vec,Vec,Vec)]=[]
func tri(_ a:Vec,_ b:Vec,_ c:Vec){triangles.append((a,b,c))}
func quad(_ a:Vec,_ b:Vec,_ c:Vec,_ d:Vec){tri(a,b,c);tri(a,c,d)}
func box(_ x0:Double,_ y0:Double,_ z0:Double,_ x1:Double,_ y1:Double,_ z1:Double) { let a=Vec(x:Float(x0),y:Float(y0),z:Float(z0)),b=Vec(x:Float(x1),y:Float(y0),z:Float(z0)),c=Vec(x:Float(x1),y:Float(y1),z:Float(z0)),d=Vec(x:Float(x0),y:Float(y1),z:Float(z0)),e=Vec(x:Float(x0),y:Float(y0),z:Float(z1)),f=Vec(x:Float(x1),y:Float(y0),z:Float(z1)),g=Vec(x:Float(x1),y:Float(y1),z:Float(z1)),h=Vec(x:Float(x0),y:Float(y1),z:Float(z1)); quad(a,d,c,b);quad(e,f,g,h);quad(a,b,f,e);quad(b,c,g,f);quad(c,d,h,g);quad(d,a,e,h) }
box(0,0,0,width,depth,baseHeight)
let cols=Int(ceil(width/pixel)), rows=Int(ceil(depth/pixel)); var cells=Array(repeating:false,count:cols*rows)
for r in 0..<rows { for c in 0..<cols { cells[r*cols+c]=filled(Point(x:(Double(c)+0.5)*pixel,y:(Double(r)+0.5)*pixel)) } }
func on(_ c:Int,_ r:Int)->Bool { c>=0 && r>=0 && c<cols && r<rows && cells[r*cols+c] }
for r in 0..<rows { for c in 0..<cols where on(c,r) { let x0=Double(c)*pixel,x1=min(x0+pixel,width),y0=Double(r)*pixel,y1=min(y0+pixel,depth),z0=baseHeight,z1=baseHeight+letterHeight; let a=Vec(x:Float(x0),y:Float(y0),z:Float(z0)),b=Vec(x:Float(x1),y:Float(y0),z:Float(z0)),cc=Vec(x:Float(x1),y:Float(y1),z:Float(z0)),d=Vec(x:Float(x0),y:Float(y1),z:Float(z0)),e=Vec(x:Float(x0),y:Float(y0),z:Float(z1)),f=Vec(x:Float(x1),y:Float(y0),z:Float(z1)),g=Vec(x:Float(x1),y:Float(y1),z:Float(z1)),h=Vec(x:Float(x0),y:Float(y1),z:Float(z1)); quad(a,d,cc,b);quad(e,f,g,h); if !on(c,r-1){quad(a,b,f,e)};if !on(c+1,r){quad(b,cc,g,f)};if !on(c,r+1){quad(cc,d,h,g)};if !on(c-1,r){quad(d,a,e,h)} } }
func u32(_ v:UInt32,_ d:inout Data){var n=v.littleEndian;d.append(Data(bytes:&n,count:4))}; func flt(_ v:Float,_ d:inout Data){var n=v.bitPattern.littleEndian;d.append(Data(bytes:&n,count:4))}
var data=Data(repeating:0,count:80);u32(UInt32(triangles.count),&data)
for (a,b,c) in triangles { let ux=b.x-a.x,uy=b.y-a.y,uz=b.z-a.z,vx=c.x-a.x,vy=c.y-a.y,vz=c.z-a.z; flt(uy*vz-uz*vy,&data);flt(uz*vx-ux*vz,&data);flt(ux*vy-uy*vx,&data);for p in [a,b,c]{flt(p.x,&data);flt(p.y,&data);flt(p.z,&data)};data.append(contentsOf:[0,0]) }
try data.write(to:URL(fileURLWithPath:output)); print("Created \(output): \(String(format:"%.1f",width)) × \(String(format:"%.1f",depth)) × \(String(format:"%.1f",baseHeight+letterHeight)) mm, \(triangles.count) triangles")
